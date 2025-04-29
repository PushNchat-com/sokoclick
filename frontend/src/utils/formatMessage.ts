import { TranslationObject } from "../store/LanguageContext";

/**
 * Formats error messages according to our standardized pattern:
 * [What happened] because [Why]. To fix, [How].
 */
type ErrorType =
  | "connection"
  | "validation"
  | "permission"
  | "notFound"
  | "timeout"
  | "server"
  | "input"
  | "upload"
  | "generic";

interface MessageComponents {
  what: TranslationObject;
  why: TranslationObject;
  how: TranslationObject;
}

export const standardErrorMessages: Record<ErrorType, MessageComponents> = {
  connection: {
    what: {
      en: "Unable to connect to the server",
      fr: "Impossible de se connecter au serveur",
    },
    why: {
      en: "because of network issues",
      fr: "en raison de problèmes de réseau",
    },
    how: {
      en: "check your internet connection and try again",
      fr: "vérifiez votre connexion internet et réessayez",
    },
  },
  validation: {
    what: {
      en: "Unable to save changes",
      fr: "Impossible d'enregistrer les modifications",
    },
    why: {
      en: "because some information is incorrect or missing",
      fr: "car certaines informations sont incorrectes ou manquantes",
    },
    how: {
      en: "review the highlighted fields and correct the errors",
      fr: "examinez les champs surlignés et corrigez les erreurs",
    },
  },
  permission: {
    what: {
      en: "Unable to perform this action",
      fr: "Impossible d'effectuer cette action",
    },
    why: {
      en: "because you don't have the required permissions",
      fr: "car vous n'avez pas les autorisations requises",
    },
    how: {
      en: "contact an administrator if you need access",
      fr: "contactez un administrateur si vous avez besoin d'accès",
    },
  },
  notFound: {
    what: {
      en: "Unable to find the requested item",
      fr: "Impossible de trouver l'élément demandé",
    },
    why: {
      en: "because it may have been moved or deleted",
      fr: "car il a peut-être été déplacé ou supprimé",
    },
    how: {
      en: "check the ID or navigate back to the previous page",
      fr: "vérifiez l'ID ou retournez à la page précédente",
    },
  },
  timeout: {
    what: {
      en: "Request took too long to complete",
      fr: "La requête a pris trop de temps",
    },
    why: {
      en: "because the server is busy or temporarily unavailable",
      fr: "car le serveur est occupé ou temporairement indisponible",
    },
    how: {
      en: "try again in a few moments",
      fr: "réessayez dans quelques instants",
    },
  },
  server: {
    what: {
      en: "The system encountered an error",
      fr: "Le système a rencontré une erreur",
    },
    why: {
      en: "because of an unexpected technical problem",
      fr: "en raison d'un problème technique inattendu",
    },
    how: {
      en: "try again or contact support if the problem persists",
      fr: "réessayez ou contactez le support si le problème persiste",
    },
  },
  input: {
    what: {
      en: "Unable to process your input",
      fr: "Impossible de traiter votre saisie",
    },
    why: {
      en: "because it contains invalid characters or format",
      fr: "car elle contient des caractères ou un format invalide",
    },
    how: {
      en: "check the formatting guidelines and try again",
      fr: "vérifiez les directives de formatage et réessayez",
    },
  },
  upload: {
    what: {
      en: "Unable to upload your file",
      fr: "Impossible de télécharger votre fichier",
    },
    why: {
      en: "because it may be too large or in an unsupported format",
      fr: "car il peut être trop volumineux ou dans un format non pris en charge",
    },
    how: {
      en: "check the file size and format requirements, then try again",
      fr: "vérifiez les exigences de taille et de format de fichier, puis réessayez",
    },
  },
  generic: {
    what: {
      en: "Something went wrong",
      fr: "Une erreur s'est produite",
    },
    why: {
      en: "because of an unexpected issue",
      fr: "en raison d'un problème inattendu",
    },
    how: {
      en: "try again or refresh the page",
      fr: "réessayez ou actualisez la page",
    },
  },
};

/**
 * Formats a standard error message based on type
 */
export function formatErrorMessage(
  type: ErrorType,
  customComponents?: Partial<MessageComponents>,
): TranslationObject {
  const baseMessage = standardErrorMessages[type];
  const message = {
    what: customComponents?.what || baseMessage.what,
    why: customComponents?.why || baseMessage.why,
    how: customComponents?.how || baseMessage.how,
  };

  return {
    en: `${message.what.en} ${message.why.en}. To fix, ${message.how.en}.`,
    fr: `${message.what.fr} ${message.why.fr}. Pour résoudre, ${message.how.fr}.`,
  };
}

/**
 * Creates a custom formatted message following the standard pattern
 */
export function createCustomMessage(
  components: MessageComponents,
): TranslationObject {
  return {
    en: `${components.what.en} ${components.why.en}. To fix, ${components.how.en}.`,
    fr: `${components.what.fr} ${components.why.fr}. Pour résoudre, ${components.how.fr}.`,
  };
}

/**
 * Formats a success message
 */
export function formatSuccessMessage(
  what: TranslationObject,
  nextSteps?: TranslationObject,
): TranslationObject {
  if (nextSteps) {
    return {
      en: `${what.en}. ${nextSteps.en}`,
      fr: `${what.fr}. ${nextSteps.fr}`,
    };
  }

  return what;
}

/**
 * Translates technical error messages to user-friendly messages
 */
export function translateTechnicalError(error: Error | string): ErrorType {
  const message = typeof error === "string" ? error : error.message;

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connect") ||
    message.includes("RPC failed")
  ) {
    return "connection";
  }

  if (
    message.includes("permission") ||
    message.includes("403") ||
    message.includes("auth")
  ) {
    return "permission";
  }

  if (
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("no rows")
  ) {
    return "notFound";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }

  if (message.includes("validation") || message.includes("invalid")) {
    return "validation";
  }

  if (
    message.includes("upload") ||
    message.includes("file") ||
    message.includes("image")
  ) {
    return "upload";
  }

  if (
    message.includes("server") ||
    message.includes("500") ||
    message.includes("database")
  ) {
    return "server";
  }

  return "generic";
}
