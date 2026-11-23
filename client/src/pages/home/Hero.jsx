import { useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Phone, ScreenTracking } from "./Phone";

/** Sticky glass bar under the global nav, like the bar on a product page: name, section links, and a buy-style button. */
export function LocalNav({ onJump }) {
  const links = [
    ["overview", "نظرة عامة"],
    ["how", "كيف بيشتغل"],
    ["why", "ليش توصيل"],
    ["restaurants", "المطاعم"],
  ];
  return (
    <nav
      aria-label="أقسام الصفحة"
      className="material-bar sticky top-0 z-40 border-b border-black/10"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <p className="text-[21px] font-semibold">توصيل</p>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {links.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onJump(id);
                }}
                className="py-3 text-[12px] text-ink/80 transition hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
          <button
            onClick={() => onJump("restaurants")}
            className="btn-primary h-11 px-4 py-0 text-[14px] md:h-9 md:text-[12px]"
          >
            اطلب الآن
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * Dark hero. On load the words and the phone rise in; while you scroll away the text fades and lifts,
 * the phone rises and tilts, and the glow behind it grows.
 */
export function Hero({ onJump }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .from(".hero-glow", { scale: 0.4, opacity: 0, duration: 2 }, 0)
          .from(".hero-eyebrow", { y: 20, opacity: 0, duration: 1 }, 0.1)
          .from(
            ".hero-word",
            {
              y: 60,
              opacity: 0,
              filter: "blur(10px)",
              duration: 1.2,
              stagger: 0.08,
            },
            0.2,
          )
          .from(".hero-sub", { y: 20, opacity: 0, duration: 1 }, 0.6)
          .from(".hero-cta", { y: 20, opacity: 0, duration: 1 }, 0.75)
          .from(
            ".hero-phone",
            { y: 220, rotateX: 25, opacity: 0, duration: 1.6 },
            0.4,
          );

        const scroll = {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        };
        gsap.to(".hero-text", {
          y: -80,
          opacity: 0,
          ease: "none",
          scrollTrigger: { ...scroll, end: "60% top" },
        });
        gsap.to(".hero-phone-move", {
          y: -140,
          rotate: -6,
          scale: 1.08,
          ease: "none",
          scrollTrigger: scroll,
        });
        gsap.to(".hero-glow", {
          scale: 1.6,
          ease: "none",
          scrollTrigger: scroll,
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id="overview"
      className="relative scroll-mt-14 overflow-hidden bg-black pt-16 text-center text-white md:pt-24"
    >
      {/* Warm glow behind the phone. */}
      <div className="hero-glow pointer-events-none absolute top-[40%] left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(232_93_30/0.55),rgb(255_170_60/0.18)_55%,transparent)]" />

      <div className="hero-text relative px-4">
        <p className="hero-eyebrow bg-gradient-to-l from-[#ffb36b] to-[#ff7a3d] bg-clip-text text-[21px] font-semibold text-transparent md:text-[28px]">
          توصيل
        </p>
        <h1 className="mx-auto mt-3 max-w-4xl text-[44px] leading-[1.05] font-semibold text-balance md:text-[80px]">
          {"أكلك المفضل، لحد باب البيت.".split(" ").map((w, i) => (
            <span key={i} className="hero-word inline-block">
              {w}&nbsp;
            </span>
          ))}
        </h1>
        <p className="hero-sub mx-auto mt-5 max-w-xl text-[19px] leading-snug text-balance text-[#a1a1a6] md:text-[24px]">
          مطاعم غزة المفضلة، بالأسعار، بكبسة زر. وتابع طلبك لحظة بلحظة.
        </p>
        <div className="hero-cta mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <button onClick={() => onJump("restaurants")} className="btn-primary">
            اطلب الآن
          </button>
          <button
            onClick={() => onJump("how")}
            className="inline-flex items-center gap-0.5 py-3 text-[17px] text-[#ff9f6b] hover:underline"
          >
            كيف بيشتغل
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {/* The phone is cut off by the bottom of the section, like a product shot. */}
      <div className="relative mt-14 h-[440px] [perspective:1200px] md:mt-20 md:h-[560px]">
        <div className="hero-phone-move">
          <Phone className="hero-phone mx-auto w-[270px] md:w-[320px]">
            <ScreenTracking current={3} />
          </Phone>
        </div>
      </div>
    </section>
  );
}

const STATEMENT =
  "كل مطاعم غزة المفضلة بمكان واحد. القائمة كاملة بالأسعار، والطلب بكبسة زر. وبعدها؟ بتعرف وين وصل أكلك، لحظة بلحظة، لحد باب البيت.";

/** A big statement whose words light up one by one as you scroll through it. */
export function Statement() {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".st-word",
          { color: "#6e6e73" }, // unread words stay readable (above 3:1 at this size), then turn black
          {
            color: "#1d1d1f",
            ease: "none",
            stagger: 0.1,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 75%",
              end: "bottom 40%",
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="px-4 py-28 md:py-44">
      <p className="mx-auto max-w-4xl text-[32px] leading-[1.2] font-semibold md:text-[56px]">
        {STATEMENT.split(" ").map((w, i) => (
          <span key={i} className="st-word">
            {w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
