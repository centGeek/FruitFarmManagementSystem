import { Link } from 'react-router-dom';
import { MapPin, Users, Wallet, Coins, BarChart3, CloudSun, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const features = [
  { icon: MapPin, key: 'map' },
  { icon: Users, key: 'workforce' },
  { icon: Wallet, key: 'salary' },
  { icon: Coins, key: 'finance' },
  { icon: BarChart3, key: 'analytics' },
  { icon: CloudSun, key: 'weather' },
];

export default function AboutPage() {
  const { t } = useTranslation('about');

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
            {t('backToLogin')}
          </Link>
        </div>
      </header>

      {/* Hero z logo */}
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-16 text-center">
        <img
          src="/logo-mark.png"
          alt={t('logoAlt')}
          className="mx-auto w-full max-w-md"
        />
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
          {t('hero')}
        </p>
      </section>

      {/* Dla kogo? */}
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('audience.title')}</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {t('audience.body')}
        </p>
      </section>

      {/* Dlaczego? */}
      <section className="mx-auto max-w-3xl px-6 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('why.title')}</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {t('why.intro')}
        </p>
        <ul className="mt-5 space-y-3 text-base leading-relaxed text-slate-600">
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            {t('why.points.salary')}
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            {t('why.points.finance')}
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            {t('why.points.map')}
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
            {t('why.points.weather')}
          </li>
        </ul>
        <p className="mt-5 text-base leading-relaxed text-slate-600">
          {t('why.outro')}
        </p>
      </section>

      {/* Funkcje */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('features.title')}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.key}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{t(`features.${f.key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(`features.${f.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('cta.title')}
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            {t('cta.login')}
          </Link>
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            {t('cta.register')}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-slate-400">
          {t('footer')}
        </div>
      </footer>
    </div>
  );
}
