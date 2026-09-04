export type ConsultationField = "name" | "phone" | "email";

export type ConsultationErrors = Partial<Record<ConsultationField, string>>;

interface ConsultationValues {
  name: string;
  phone: string;
  email?: string;
}

interface ConsultationValidationOptions {
  emailRequired?: boolean;
}

export function normalizeVietnamPhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

export function validateConsultationField(
  field: ConsultationField,
  value: string,
  options: ConsultationValidationOptions = {},
) {
  const trimmedValue = value.trim();

  if (field === "name") {
    return trimmedValue.length >= 2
      ? undefined
      : "Vui lòng nhập họ tên có ít nhất 2 ký tự.";
  }

  if (field === "phone") {
    return /^(?:\+84|0)\d{9}$/.test(normalizeVietnamPhone(value))
      ? undefined
      : "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có đủ 10 chữ số.";
  }

  if (!trimmedValue) {
    return options.emailRequired ? "Vui lòng nhập địa chỉ email." : undefined;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)
    ? undefined
    : "Địa chỉ email không đúng định dạng.";
}

export function validateConsultation(
  values: ConsultationValues,
  options: ConsultationValidationOptions = {},
): ConsultationErrors {
  const errors: ConsultationErrors = {};

  for (const field of ["name", "phone", "email"] as const) {
    const error = validateConsultationField(field, values[field] || "", options);
    if (error) errors[field] = error;
  }

  return errors;
}
