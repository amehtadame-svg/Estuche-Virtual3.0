import { useEffect, useId, useState } from 'react';
import './PhoneInput.css';

import { splitPhone } from '../../lib/phone';

export default function PhoneInput({ value, onChange, required = false }: {
  value: string; onChange: (value: string) => void; required?: boolean;
}) {
  const id = useId();
  const [code, setCode] = useState(() => splitPhone(value).code);
  const number = splitPhone(value).number;

  useEffect(() => {
    if (/^\+\d{1,3} \d{10}$/.test(value)) setCode(splitPhone(value).code);
  }, [value]);

  const updateNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    onChange(digits ? `+${code} ${digits}` : '');
  };

  // Separar parcialmente el prefijo durante la edición para no interpretar el número como histórico.
  const displayedNumber = value.startsWith(`+${code} `) ? value.slice(code.length + 2) : number;
  return <div className="phone-field">
    <label htmlFor={`${id}-code`}>Indicativo</label>
    <div className="phone-field-row">
      <span className="phone-prefix">+</span>
      <input id={`${id}-code`} aria-label="Indicativo de país" inputMode="numeric" value={code} maxLength={3}
        onChange={e => {
          const next = e.target.value.replace(/\D/g, '').slice(0, 3);
          setCode(next);
          if (displayedNumber) onChange(`+${next} ${displayedNumber}`);
        }} placeholder="57" />
      <input aria-label="Número de teléfono" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
        required={required} value={displayedNumber} onChange={e => updateNumber(e.target.value)} placeholder="10 dígitos" />
    </div>
    <small>Indicativo de 1 a 3 dígitos y número de 10 dígitos.</small>
  </div>;
}
