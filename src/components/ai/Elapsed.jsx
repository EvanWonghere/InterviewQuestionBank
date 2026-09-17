import { useEffect, useState } from 'react';

// Mount only while waiting: thinking-mode generations can take up to 90 seconds.
export default function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="tabular-nums">（已等待 {seconds} 秒，深度思考最长约 90 秒）</span>;
}
