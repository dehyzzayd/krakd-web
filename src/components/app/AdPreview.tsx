"use client";

/* Renders an ad creative inside a believable Facebook / Instagram / Google frame.
   Shared by the campaign builder (live) and the campaign detail page (snapshot). */

import { Globe, ThumbsUp, MessageCircle, Share2, Heart, Send, Bookmark, MoreHorizontal, Phone } from "lucide-react";
import { cn } from "@/lib/cn";

export type AdCreative = {
  network: "FACEBOOK" | "INSTAGRAM" | "GOOGLE";
  business: string;
  image: string | null;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  price?: number | null;
  domain?: string;
};

export const CTA_LABEL: Record<string, string> = {
  LEARN_MORE: "Learn More", SHOP_NOW: "Shop Now", GET_OFFER: "Get Offer",
  BOOK_NOW: "Book Now", CALL_NOW: "Call Now", SEND_MESSAGE: "Send Message", GET_QUOTE: "Get Quote",
};

const initial = (s: string) => (s.trim()[0] || "K").toUpperCase();
const cleanDomain = (d?: string, biz?: string) => (d || `${(biz || "dealer").toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`).replace(/^https?:\/\//, "");
const Ph = ({ className }: { className?: string }) => (
  <div className={cn("grid place-items-center bg-gradient-to-br from-n100 to-n200 text-[11px] font-medium text-n400", className)}>No image yet</div>
);

function FacebookAd(c: AdCreative) {
  const cta = CTA_LABEL[c.cta] ?? "Learn More";
  return (
    <div className="overflow-hidden rounded-xl border border-n200 bg-white text-[13px] shadow-sm">
      <div className="flex items-center gap-2 px-3 pt-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">{initial(c.business)}</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold text-n900">{c.business}</p>
          <p className="flex items-center gap-1 text-[11px] text-n500">Sponsored · <Globe className="h-3 w-3" /></p>
        </div>
        <MoreHorizontal className="ml-auto h-5 w-5 text-n400" />
      </div>
      <p className="whitespace-pre-line px-3 py-2 text-[13px] leading-snug text-n800">{c.primaryText}</p>
      {c.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <Ph className="aspect-[1.91/1] w-full" />}
      <div className="flex items-center gap-3 bg-n50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] uppercase tracking-wide text-n500">{cleanDomain(c.domain, c.business)}</p>
          <p className="truncate text-[14px] font-bold text-n900">{c.headline || "Your headline"}</p>
          {c.description && <p className="truncate text-[11.5px] text-n500">{c.description}</p>}
        </div>
        <button className="shrink-0 rounded-md bg-n200 px-3 py-1.5 text-[12px] font-semibold text-n800">{cta}</button>
      </div>
      <div className="flex items-center justify-around border-t border-n100 py-1.5 text-n500">
        <span className="flex items-center gap-1.5 text-[12px] font-medium"><ThumbsUp className="h-4 w-4" />Like</span>
        <span className="flex items-center gap-1.5 text-[12px] font-medium"><MessageCircle className="h-4 w-4" />Comment</span>
        <span className="flex items-center gap-1.5 text-[12px] font-medium"><Share2 className="h-4 w-4" />Share</span>
      </div>
    </div>
  );
}

function InstagramAd(c: AdCreative) {
  const cta = CTA_LABEL[c.cta] ?? "Learn More";
  const user = c.business.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return (
    <div className="overflow-hidden rounded-xl border border-n200 bg-white text-[13px] shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[2px]"><span className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-bold text-n900">{initial(c.business)}</span></span>
        <div className="leading-tight"><p className="text-[13px] font-semibold text-n900">{user}</p><p className="text-[11px] text-n500">Sponsored</p></div>
        <MoreHorizontal className="ml-auto h-5 w-5 text-n400" />
      </div>
      {c.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image} alt="" className="aspect-square w-full object-cover" /> : <Ph className="aspect-square w-full" />}
      <div className="flex items-center justify-between border-y border-n100 bg-n50 px-3 py-2 text-[13px] font-semibold text-[#385898]">{cta}<span className="text-n400">›</span></div>
      <div className="flex items-center gap-4 px-3 pt-2.5 text-n800"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ml-auto h-5 w-5" /></div>
      <p className="px-3 pb-3 pt-2 text-[13px] leading-snug text-n800"><span className="font-semibold">{user}</span> {c.primaryText}</p>
    </div>
  );
}

function GoogleAd(c: AdCreative) {
  const domain = cleanDomain(c.domain, c.business);
  const isCall = c.cta === "CALL_NOW";
  return (
    <div className="space-y-3">
      {/* search text ad */}
      <div className="rounded-xl border border-n200 bg-white p-4 text-[13px] shadow-sm">
        <p className="mb-1 flex items-center gap-1.5 text-[12px] text-n700"><span className="font-bold text-n900">Sponsored</span></p>
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-n100 text-[11px] font-bold text-n700">{initial(c.business)}</span>
          <div className="leading-tight"><p className="text-[13px] font-medium text-n900">{c.business}</p><p className="text-[12px] text-n500">{domain}</p></div>
        </div>
        <p className="mt-1.5 text-[18px] leading-tight text-[#1a0dab]">{c.headline || "Your headline"}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-n600">{c.description || c.primaryText}</p>
        {isCall && <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#1a0dab]"><Phone className="h-3.5 w-3.5" />Call</p>}
      </div>
      {/* vehicle listing ad (VLA) card */}
      {c.image && (
        <div className="w-40 overflow-hidden rounded-xl border border-n200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="p-2.5">
            <p className="truncate text-[12.5px] font-semibold text-n900">{c.headline || "Vehicle"}</p>
            {c.price ? <p className="text-[13px] font-bold text-n900">${c.price.toLocaleString()}</p> : null}
            <p className="truncate text-[11px] text-n500">{c.business}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdPreview({ creative }: { creative: AdCreative }) {
  if (creative.network === "INSTAGRAM") return <InstagramAd {...creative} />;
  if (creative.network === "GOOGLE") return <GoogleAd {...creative} />;
  return <FacebookAd {...creative} />;
}
