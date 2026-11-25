import { Page } from '@/components/Layout'
import photos from '@/data/dish-photos.json'

/** Photo credits: the dish photos are free-license photos (Creative Commons / public domain) that require credit. */
export default function CreditsPage() {
  // Only Creative Commons photos need credit; photos supplied by the site owner have no credit entry.
  const dishes = (photos.dishes || []).filter((d) => d.credit)
  return (
    <Page title="مصادر الصور" subtitle="صور الأطباق من مصوّرين نشروها برخص حرّة. شكراً إلهم.">
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
        {dishes.map((d) => (
          <li key={d.restaurant + d.name} className="card flex items-center gap-3 p-3">
            <img src={d.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" loading="lazy" />
            <div className="min-w-0 text-[13px]">
              <p className="text-[15px] font-semibold">{d.name}</p>
              {/* The photographer is always shown in full (the license requires credit); a long title may be shortened. */}
              <p className="text-stone-600">
                تصوير: <span dir="auto">{d.credit.creator || 'غير معروف'}</span>
              </p>
              <p className="truncate text-stone-500" dir="auto">
                «{d.credit.title}»
              </p>
              <p className="flex flex-wrap gap-x-3">
                <a href={d.credit.licenseUrl} target="_blank" rel="noreferrer" className="inline-block py-1.5 text-brand-700 hover:underline" dir="ltr">
                  {d.credit.license}
                </a>
                <a href={d.credit.source} target="_blank" rel="noreferrer" className="inline-block py-1.5 text-brand-700 hover:underline">
                  المصدر
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[12px] text-stone-500">الصور مصغّرة ومضغوطة لتناسب الموقع. الأطباق والمطاعم المعروضة تجريبية لأغراض العرض.</p>
    </Page>
  )
}
