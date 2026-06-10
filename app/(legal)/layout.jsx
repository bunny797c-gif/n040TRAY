import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LegalLayout({ children }) {
  return (
    <>
      <Header />
      <article className="legal-page">
        {children}
      </article>
      <Footer />
    </>
  );
}
