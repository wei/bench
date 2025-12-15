import { cn } from "@/lib/utils";

interface BenchLogoProps {
  className?: string;
}

export function BenchLogo({ className }: BenchLogoProps) {
  return (
    <svg
      viewBox="0 0 32 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-4", className)}
    >
      <title>Bench logo</title>
      <path
        d="M0 0L32 -1.39876e-06V16L28.4346 16V3.81445L3.56543 3.81445L3.56543 16L0 16L0 0Z"
        className="fill-current"
      />
      <path
        d="M0 0L32 -1.39876e-06V16L28.4346 16V3.81445L3.56543 3.81445L3.56543 16L0 16L0 0Z"
        className="stroke-current"
      />
    </svg>
  );
}
