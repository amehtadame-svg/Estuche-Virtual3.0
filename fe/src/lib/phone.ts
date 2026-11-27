/** Se conservan los teléfonos históricos de 10 dígitos; los nuevos incluyen indicativo. */
export function splitPhone(value: string) {
  const match = value.match(/^\+(\d{1,3}) (\d{10})$/);
  return match ? { code: match[1], number: match[2] } : { code: '57', number: value };
}

export function validPhone(value: string) {
  return value === '' || /^\+\d{1,3} \d{10}$/.test(value) || /^\d{10}$/.test(value);
}
