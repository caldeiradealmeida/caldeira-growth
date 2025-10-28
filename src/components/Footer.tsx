const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-accent">
            Cresça ou Desapareça
          </h3>
          <p className="text-primary-foreground/80">
            Por Denis Caldeira de Almeida
          </p>
          <p className="text-primary-foreground/60 text-sm">
            Estrategista de Negócios e Conselheiro de Empresas
          </p>
          <div className="pt-6 border-t border-primary-foreground/20">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
