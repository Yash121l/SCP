import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

function isHttpError(error: unknown): error is Error & { code?: string; statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}

function isDatabaseError(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        code: "VALIDATION_ERROR",
        issues: error.issues,
        message: "Invalid request payload",
      });
    }

    if (isHttpError(error)) {
      return reply.code(error.statusCode).send({
        code: error.code ?? "REQUEST_ERROR",
        message: error.message,
      });
    }

    if (isDatabaseError(error)) {
      if (error.code === "23505") {
        return reply.code(409).send({
          code: "CONFLICT",
          message: "A record with these unique fields already exists",
        });
      }

      if (error.code === "23503") {
        return reply.code(400).send({
          code: "INVALID_REFERENCE",
          message: "Referenced record does not exist",
        });
      }

      if (error.code === "23514") {
        return reply.code(400).send({
          code: "DATA_SANITY_ERROR",
          message: "Data violates a database sanity constraint",
        });
      }
    }

    app.log.error(error);
    return reply.code(500).send({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    });
  });
}
