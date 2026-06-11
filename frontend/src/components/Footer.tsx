export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🌱</span>
            <span className="font-semibold">Fruit Farm Management System</span>
          </div>
          <div className="text-xs text-white/80 text-center sm:text-right">
            © {currentYear} Wszelkie prawa zastrzeżone. Autor:{" "}
            <span className="font-semibold text-white">Łukasz Centkowski</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
