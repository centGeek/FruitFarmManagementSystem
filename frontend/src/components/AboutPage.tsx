import { Link } from 'react-router-dom';
import { MapPin, Users, Wallet, Coins, BarChart3, CloudSun, ArrowLeft } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Mapa sadu',
    desc: 'Rysuj sektory na interaktywnej mapie i przypisuj do nich pracowników oraz rodzaje upraw.',
  },
  {
    icon: Users,
    title: 'Pracownicy i ewidencja pracy',
    desc: 'Zarządzaj pracownikami, planuj harmonogram i rejestruj przepracowane godziny lub zebrane kilogramy.',
  },
  {
    icon: Wallet,
    title: 'Wynagrodzenia',
    desc: 'Automatyczne naliczanie wypłat na podstawie stawki godzinowej lub stawki za kilogram zbiorów.',
  },
  {
    icon: Coins,
    title: 'Finanse sadu',
    desc: 'Zaliczki, wydatki, przychody i realny zysk — pełen obraz finansów Twojego gospodarstwa.',
  },
  {
    icon: BarChart3,
    title: 'Analiza efektywności',
    desc: 'Czytelne zestawienia, które pomagają monitorować wyniki i optymalizować wykorzystanie zasobów.',
  },
  {
    icon: CloudSun,
    title: 'Notyfikacje pogodowe',
    desc: 'Alerty o anomaliach i zmianach pogody dla lokalizacji Twojego sadu.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Górny pasek */}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Powrót do logowania
          </Link>
        </div>
      </header>

      {/* Hero z logo */}
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-16 text-center">
        <img
          src="/logo-mark.png"
          alt="MenadżerSadu"
          className="mx-auto w-full max-w-md"
        />
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
          Kompleksowy system do zarządzania gospodarstwem sadowniczym — planowanie pracy, ewidencja
          zbiorów, finanse i pogoda w jednym, uporządkowanym miejscu.
        </p>
      </section>

      {/* Dla kogo? */}
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dla kogo?</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          MenadżerSadu powstał z myślą o właścicielach i zarządcach gospodarstw sadowniczych — od
          niewielkich, rodzinnych sadów po większe plantacje owocowe. To narzędzie dla każdego, kto
          zatrudnia pracowników (również sezonowych), planuje i rozlicza ich pracę, prowadzi
          ewidencję zebranych owoców i chce trzymać rękę na pulsie finansów swojego gospodarstwa.
          Jeśli do tej pory wszystko zapisywałeś w zeszycie albo w rozjeżdżających się arkuszach
          kalkulacyjnych — ta aplikacja zbierze to w jednym, przejrzystym miejscu.
        </p>
      </section>

      {/* Dlaczego? */}
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dlaczego MenadżerSadu?</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Prowadzenie sadu to dziesiątki codziennych decyzji: kto i gdzie dziś pracował, ile godzin
          lub kilogramów, ile to kosztowało i czy sad na siebie zarabia. MenadżerSadu odciąża Cię od
          ręcznych obliczeń i porządkuje dane:
        </p>
        <ul className="mt-5 space-y-3 text-base leading-relaxed text-slate-600">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            automatycznie nalicza wynagrodzenia na podstawie przepracowanych godzin lub zebranych
            kilogramów,
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            pokazuje koszty, przychody i realny zysk w czytelnych zestawieniach,
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            przypisuje pracowników do konkretnych sektorów na mapie Twojego sadu,
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            ostrzega o niebezpiecznych zjawiskach pogodowych dla Twojej lokalizacji.
          </li>
        </ul>
        <p className="mt-5 text-base leading-relaxed text-slate-600">
          Dzięki temu, zamiast tonąć w papierach, możesz skupić się na tym, co najważniejsze — na
          swoich owocach.
        </p>
      </section>

      {/* Funkcje */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Co znajdziesz w środku</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Gotowy, żeby uporządkować swój sad?
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            Zaloguj się
          </Link>
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            Załóż konto
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-slate-400">
          © 2026 MenadżerSadu — Cyfrowe zarządzanie gospodarstwem sadowniczym
        </div>
      </footer>
    </div>
  );
}
