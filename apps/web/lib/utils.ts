/**
 * Formatea un número a dos decimales exactos.
 * Ejemplo: 1234.5 -> "1234.50"
 */
export function formatDecimal(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0.00";

  return num.toFixed(2);
}

/**
 * Formatea una fecha al formato DD/MM/AA.
 * Ejemplo: new Date() -> "19/04/26"
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) return "--/--/--";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

/**
 * Limpia un string de caracteres especiales, permitiendo solo letras, números y espacios.
 */
export function sanitizeString(val: string): string {
  return val.replace(/[^a-zA-Z0-9 \u00C0-\u017F]/g, "");
}

/**
 * Filtra un string para permitir únicamente dígitos.
 * Útil para campos de cédula, teléfono, etc.
 */
export function onlyNumbers(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Valida si un string contiene exclusivamente números.
 */
export function isValidNumeric(val: string): boolean {
  return /^\d+$/.test(val);
}

/**
 * Convierte el texto a formato título (primera letra de cada palabra en mayúscula).
 */
export function capitalize(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export function isEmpty(text: string | null | undefined): boolean {
  if (text === null || text === undefined) return true;
  return text.toString().trim().length === 0;
}

export function isNumbersLettersAndSymbolsValid(text: string): boolean {
  const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ!@#\$%\^&*\)\(+=._,\s-]+$/;
  return !isEmpty(text) && regex.test(text);
}

export function isEmail(email: string): boolean {
  const regexEmail: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return !isEmpty(email) && regexEmail.test(email);
}

export function isPhone(phone: string): boolean {
  if (isEmpty(phone)) return false;
  const regexPhone: RegExp = /^\+?\d{1,4}?[-.\s]?(\(?\d{1,4}?\))?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
  return regexPhone.test(phone);
}

export function isValidID(id: string): boolean {
  if (isEmpty(id)) return false;
  const justNumbers = id.replace(/-/g, "").toUpperCase();
  const regex = /^[VE][0-9]{7,8}$/;
  return regex.test(justNumbers);
}