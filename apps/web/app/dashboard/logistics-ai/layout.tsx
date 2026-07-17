/** Layout más ancho para el dashboard de monitoreo IA */
export default function LogisticsAiLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mx-2 max-w-none w-[calc(100%+1rem)]">{children}</div>;
}
