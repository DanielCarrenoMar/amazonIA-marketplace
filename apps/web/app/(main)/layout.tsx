import { Navbar, Footer } from "@/components";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="grow pt-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
