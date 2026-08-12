import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  const ar = t("brand") === "سيرتي";

  return (
    <footer className="seerati-footer-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="seerati-logo-cube grid size-9 place-items-center rounded-xl bg-emerald-accent text-ink-foreground">
              <FileText className="size-5" />
            </span>
            <p className="text-lg font-extrabold">
              {t("brand")}
              <span className="ms-1 text-xs font-medium opacity-70">Seerati</span>
            </p>
          </div>
          <p className="seerati-footer-muted mt-3 max-w-xs text-sm leading-relaxed">
            {t("tagline")}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer_product")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/templates">{t("nav_templates")}</Link>
            </li>
            <li>
              <Link to="/features">{t("nav_features")}</Link>
            </li>
            <li>
              <Link to="/team">{t("nav_team")}</Link>
            </li>
            <li>
              <Link to="/ats">{t("nav_ats")}</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer_company")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/auth">{t("nav_login")}</Link>
            </li>
            <li>
              <Link to="/dashboard">{t("nav_dashboard")}</Link>
            </li>
            <li>
              <Link to="/privacy">{ar ? "سياسة الخصوصية" : "Privacy policy"}</Link>
            </li>
            <li>
              <Link to="/terms">{ar ? "شروط الاستخدام" : "Terms of use"}</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">{ar ? "تواصل" : "Contact"}</p>
          <p className="seerati-footer-muted">hello@seerati.sa</p>
          <p className="seerati-footer-muted mt-1">
            {ar ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
          </p>
        </div>
      </div>
      <div className="seerati-footer-rule border-t py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} Seerati — {t("footer_rights")}
      </div>
    </footer>
  );
}
