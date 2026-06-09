import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="cc-page-shell min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
