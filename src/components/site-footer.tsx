import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold">{t("brand")} | Seerati</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer_product")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/templates" className="hover:text-foreground">
                {t("nav_templates")}
              </Link>
            </li>
            <li>
              <Link to="/features" className="hover:text-foreground">
                {t("nav_features")}
              </Link>
            </li>
            <li>
              <Link to="/ats" className="hover:text-foreground">
                {t("nav_ats")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer_company")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="hover:text-foreground">
                {t("nav_login")}
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                {t("nav_dashboard")}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                {t("brand") === "سيرتي" ? "سياسة الخصوصية" : "Privacy policy"}
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground">
                {t("brand") === "سيرتي" ? "شروط الاستخدام" : "Terms of use"}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="mb-3 font-semibold text-foreground">
            {t("brand") === "سيرتي" ? "تواصل" : "Contact"}
          </p>
          <p>hello@seerati.sa</p>
          <p className="mt-1">الرياض، المملكة العربية السعودية</p>
        </div>
      </div>
      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Seerati — {t("footer_rights")}
      </div>
    </footer>
  );
}
