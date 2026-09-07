import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

type ModeCardProps = {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  action: string;
  badge: string;
  available?: boolean;
};

export function ModeCard({
  href,
  icon,
  title,
  description,
  action,
  badge,
  available = false,
}: ModeCardProps) {
  return (
    <Link href={href} className="mode-card group">
      <div className="flex items-center justify-between">
        <span className={`mode-icon ${available ? "" : "purple"}`}>
          <Icon name={icon} />
        </span>
        <span className={`badge ${available ? "accent-badge" : ""}`}>
          {available && <span className="status-dot" />}
          {badge}
        </span>
      </div>

      <h3 className="text-2xl font-bold tracking-tight mt-6">{title}</h3>
      <p className="text-sm text-muted leading-6 max-w-[355px] mt-2">{description}</p>

      <div className="flex items-center justify-between mt-7 pt-5 border-t border-line text-sm font-semibold">
        <span>{action}</span>
        <Icon
          name="arrow"
          className={`${available ? "text-accent" : "text-lilac"} transition-transform group-hover:translate-x-1`}
        />
      </div>
    </Link>
  );
}
