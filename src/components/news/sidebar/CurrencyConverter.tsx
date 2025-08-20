"use client";

import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

export default function CurrencyConverter() {
  const currencies: Array<{ code: string; name: string }> = [
    { code: 'CRC', name: 'Colón de Costa Rica' },
    { code: 'USD', name: 'Dólar Americano' },
    { code: 'EUR', name: 'Euro' },
    { code: 'COP', name: 'Peso Colombiano' },
    { code: 'MXN', name: 'Peso Mexicano' },
    { code: 'ARS', name: 'Peso Argentino' },
  ];

  const [amount, setAmount] = useState<string>('1');
  const [fromCur, setFromCur] = useState<string>('CRC');
  const [toCur, setToCur] = useState<string>('USD');
  const [convLoading, setConvLoading] = useState<boolean>(false);
  const [convResult, setConvResult] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    const doConvert = async () => {
      try {
        setConvLoading(true);
        const amt = parseFloat((amount || '0').toString().replace(',', '.')) || 0;
        const url = `https://api.exchangerate.host/convert?from=${fromCur}&to=${toCur}&amount=${amt}`;
        let ok = false;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (typeof data?.result === 'number') {
            if (!ignore) setConvResult(data.result);
            ok = true;
          }
        } catch {}
        if (!ok) {
          try {
            const res2 = await fetch(`https://open.er-api.com/v6/latest/${fromCur}`);
            const data2 = await res2.json();
            const rate = data2?.rates?.[toCur];
            if (typeof rate === 'number') {
              if (!ignore) setConvResult(amt * rate);
              ok = true;
            }
          } catch {}
        }
        if (!ok && !ignore) setConvResult(null);
      } catch (e) {
        if (!ignore) setConvResult(null);
      } finally {
        if (!ignore) setConvLoading(false);
      }
    };
    doConvert();
    return () => { ignore = true; };
  }, [amount, fromCur, toCur]);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 bg-[#FFFFFF]/10 rounded-lg px-2 py-2 mb-3">
        <span className="px-3 py-1 rounded-md bg-[#FFFFFF]/10 text-sm border border-[#FFFFFF]/10">{fromCur}</span>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[#D4D5DD] text-sm"
        />
        <button
          onClick={() => { setFromCur(toCur); setToCur(fromCur); }}
          className="p-2 rounded-md bg-[#FFFFFF]/15 hover:bg-[#D51F2F] transition-colors"
          title="Intercambiar"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="bg-[#FFFFFF]/10 rounded-lg px-3 py-2">
          <select value={fromCur} onChange={(e) => setFromCur(e.target.value)} className="w-full bg-transparent text-[#D4D5DD] text-sm outline-none">
            {currencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#1E305F]">{`${c.code} – ${c.name}`}</option>
            ))}
          </select>
        </div>
        <div className="bg-[#FFFFFF]/10 rounded-lg px-3 py-2">
          <select value={toCur} onChange={(e) => setToCur(e.target.value)} className="w-full bg-transparent text-[#D4D5DD] text-sm outline-none">
            {currencies.map((c) => (
              <option key={`${c.code}-to`} value={c.code} className="bg-[#1E305F]">{`${c.code} – ${c.name}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 bg-[#FFFFFF]/10 rounded-lg px-4 py-6 text-center">
        <div className="text-2xl font-semibold">{convLoading || convResult === null ? '—' : (convResult).toFixed(5)}</div>
        <div className="text-sm opacity-80">{toCur}</div>
      </div>
    </div>
  );
} 