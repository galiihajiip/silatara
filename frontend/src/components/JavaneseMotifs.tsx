import { useId } from "react";

type MotifProps = {
  className?: string;
};

/**
 * Siluet Gunungan Wayang (Kayon) berbasis currentColor (MIT, Pepryan).
 */
export function GununganSilhouette({ className = "h-36 w-auto" }: MotifProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 172"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M60 2C74 30 108 66 110 112 112 146 92 160 60 160 28 160 8 146 10 112 12 66 46 30 60 2Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M60 2C74 30 108 66 110 112 112 146 92 160 60 160 28 160 8 146 10 112 12 66 46 30 60 2Z"
        transform="translate(60 92) scale(.86) translate(-60 -92)"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="0.9"
      />
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M60 128V26" />
        <path d="M60 48C53 44 46 36 46 28c0-5 6-6 7-2" />
        <path d="M60 48C67 44 74 36 74 28c0-5-6-6-7-2" />
        <path d="M60 66C49.5 62 39 54 39 46c0-5 6-6 7-2" />
        <path d="M60 66C70.5 62 81 54 81 46c0-5-6-6-7-2" />
        <path d="M60 84C46 80 32 72 32 64c0-5 6-6 7-2" />
        <path d="M60 84C74 80 88 72 88 64c0-5-6-6-7-2" />
        <path d="M60 102C42.5 98 25 90 25 82c0-5 6-6 7-2" />
        <path d="M60 102C77.5 98 95 90 95 82c0-5-6-6-7-2" />
      </g>
      <g fill="currentColor">
        <circle cx="44" cy="30" r="2.2" />
        <circle cx="76" cy="30" r="2.2" />
        <circle cx="36" cy="50" r="2.2" />
        <circle cx="84" cy="50" r="2.2" />
        <circle cx="30" cy="70" r="2.2" />
        <circle cx="90" cy="70" r="2.2" />
        <circle cx="26" cy="90" r="2.2" />
        <circle cx="94" cy="90" r="2.2" />
        <circle cx="60" cy="22" r="2.2" />
      </g>
      <path d="M40 160V132H80V160" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M50 160V146A10 10 0 0 1 70 146V160" fill="currentColor" fillOpacity="0.8" />
      <path d="M34 132H86L80 124H40Z" fill="currentColor" />
      <path d="M22 166H98" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Mahkota Gunungan simetris untuk puncak CTA penutup (terinspirasi Gunungan Kayon & G20).
 */
export function GununganCrown({ className = "h-16 w-auto" }: MotifProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 96"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 84H74M146 84H208" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="64" cy="84" r="2.2" fill="currentColor" fillOpacity="0.5" />
      <circle cx="156" cy="84" r="2.2" fill="currentColor" fillOpacity="0.5" />
      <path
        d="M110 8C122 28 144 50 146 78C146 84 134 88 110 88C86 88 74 84 74 78C76 50 98 28 110 8Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M110 18C118 34 134 52 135 74C135 79 126 82 110 82C94 82 85 79 85 74C86 52 102 34 110 18Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <path d="M110 74V26M110 42C102 39 98 33 98 28M110 42C118 39 122 33 122 28M110 56C99 52 93 46 93 41M110 56C121 52 127 46 127 41M110 70C96 66 89 60 89 55M110 70C124 66 131 60 131 55" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="110" cy="21" r="2.4" fill="currentColor" />
      <path d="M98 84V74A12 12 0 0 1 122 74V84Z" fill="currentColor" fillOpacity="0.75" />
    </svg>
  );
}

/**
 * Pita awan Mega Mendung simetris untuk mengapit tajuk seksi (MIT, Pepryan).
 */
export function MegaMendungPlume({
  className = "h-8 w-28",
  flip = false,
}: MotifProps & { flip?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 70"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      className={`${flip ? "-scale-x-100" : ""} ${className}`}
    >
      {[
        { transform: "translate(-30 18) scale(0.9 0.9)" },
        { transform: "translate(250 14) scale(0.95 0.95)" },
        { transform: "translate(230 10) scale(-0.7 0.7)" },
        { transform: "translate(100 4) scale(1.25 1.25)" },
      ].map((g, gi) => (
        <g key={gi} transform={g.transform}>
          {[
            { s: 1, o: 1 },
            { s: 0.82, o: 0.78 },
            { s: 0.64, o: 0.56 },
            { s: 0.46, o: 0.36 },
            { s: 0.28, o: 0.18 },
          ].map((l) => (
            <path
              key={l.s}
              d="M10 55C2 55 2 41 12 40 8 28 24 22 32 30 34 14 56 10 62 24 68 8 94 10 94 28 106 22 118 34 110 44 120 48 116 58 106 55Z"
              transform={`translate(60 56) scale(${l.s}) translate(-60 -56)`}
              fill="currentColor"
              fillOpacity={l.o}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/**
 * Pembatas seksi ornamen Jawa Priangan / Gading (MIT, Pepryan).
 */
export function JavaneseSectionDivider({
  className = "h-7 w-60",
  variant = "priangan",
}: MotifProps & { variant?: "priangan" | "gading" }) {
  if (variant === "gading") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 240 30"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <g stroke="currentColor" strokeWidth="0.9">
          <path d="M22 15H106M134 15H218" />
        </g>
        <path d="M120 9l6 6-6 6-6-6z" fill="none" stroke="currentColor" strokeWidth="1" />
        <g fill="currentColor">
          <circle cx="120" cy="15" r="1.7" />
          <circle cx="110" cy="15" r="1.2" />
          <circle cx="130" cy="15" r="1.2" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 30"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="0.9">
        <path d="M4 15H86M154 15H236" />
      </g>
      <g fill="currentColor">
        <path d="M96 11l4 4-4 4-4-4z" />
        <path d="M144 11l4 4-4 4-4-4z" />
        <circle cx="80" cy="15" r="1.4" />
        <circle cx="160" cy="15" r="1.4" />
      </g>
      <g transform="translate(109 15) rotate(90)">
        <ellipse rx="3.1" ry="5.2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.7" />
        <path d="M-1.6-4.2Q0-6.6 1.6-4.2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      </g>
      <g transform="translate(131 15) rotate(90)">
        <ellipse rx="3.1" ry="5.2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.7" />
        <path d="M-1.6-4.2Q0-6.6 1.6-4.2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      </g>
      <g transform="translate(120 15) scale(1.15)">
        <g fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.7">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <path key={deg} d="M0-1.2C3-3 3.4-8.6 0-10.6-3.4-8.6-3-3 0-1.2Z" transform={`rotate(${deg})`} />
          ))}
        </g>
        <g fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="0.5" opacity="0.9">
          {[30, 150, 270].map((deg) => (
            <path key={deg} d="M0-1C1.8-2.4 2-5.6 0-6.8-2-5.6-1.8-2.4 0-1Z" transform={`rotate(${deg})`} />
          ))}
        </g>
        <circle r="1.7" fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * Ornamen sudut kerawang Gading yang dapat diputar ke 4 sudut kartu (MIT, Pepryan).
 */
export function JavaneseCornerOrnament({
  className = "h-10 w-10",
  corner = "tl",
}: MotifProps & { corner?: "tl" | "tr" | "bl" | "br" }) {
  const rot =
    corner === "tr"
      ? "rotate-90"
      : corner === "br"
        ? "rotate-180"
        : corner === "bl"
          ? "-rotate-90"
          : "";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={`${rot} ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M6 116V6H116" strokeWidth="1.2" />
        <path d="M13 96V13H96" strokeWidth="0.7" />
        <path d="M13 44A31 31 0 0 0 44 13" strokeWidth="0.8" />
        <path d="M13 30A17 17 0 0 0 30 13" strokeWidth="0.8" />
      </g>
      <path
        d="M0-10C1-2 2-1 10 0 2 1 1 2 0 10-1 2-2 1-10 0-2-1-1-2 0-10Z"
        transform="translate(26 26) scale(.55)"
        fill="currentColor"
      />
      <g fill="currentColor">
        <circle cx="60" cy="6" r="1.4" />
        <circle cx="6" cy="60" r="1.4" />
        <path d="M116 3l3 3-3 3-3-3zM3 116l3-3 3 3-3 3z" />
      </g>
    </svg>
  );
}

/**
 * Pola latar berulang Batik Parang Sederhana (CC0, Wikimedia Commons Ragam Hias Jawa).
 */
export function BatikParangPattern({ className = "h-full w-full" }: MotifProps) {
  const uid = useId().replace(/:/g, "");
  const pid = `parang-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern id={pid} width="64" height="64" patternUnits="userSpaceOnUse" viewBox="0 0 87.55 87.55">
          <g fill="currentColor" fillRule="evenodd">
            <path d="M23.73 29.18c-4.78 0-8.5 4.17-8.5 10.25 0 8.06 0 40.05 0 48.12h4.81c4.79 0 8.5-4.17 8.5-10.24 0-8.07 0-40.06 0-48.13h-4.81z" />
            <path d="M52.91 0c-4.78 0-8.5 4.17-8.5 10.24 0 8.07 0 40.06 0 48.13h4.82c4.78 0 8.49-4.17 8.49-10.25 0-8.06 0-40.05 0-48.12h-4.81z" />
            <path d="M36.49 59.38c-3.66 0-6.63 2.97-6.63 6.64 0 3.67 2.97 6.64 6.63 6.64 3.67 0 6.64-2.97 6.64-6.64v-6.64h-6.64z" />
            <path d="M34.64 29.18c4.78 0 8.49 4.17 8.49 10.25 0 8.06 0 10.87 0 18.94h-4.81c-4.78 0-8.5-4.17-8.5-10.25 0-8.06 0-10.87 0-18.94h4.82z" />
            <path d="M65.68 30.2c-3.67 0-6.64 2.97-6.64 6.64 0 3.66 2.97 6.63 6.64 6.63 3.66 0 6.63-2.97 6.63-6.63v-6.64h-6.63z" />
            <path d="M63.82 0c4.78 0 8.49 4.17 8.49 10.24 0 8.07 0 10.88 0 18.94h-4.81c-4.78 0-8.49-4.16-8.49-10.24 0-8.07 0-10.87 0-18.94h4.81z" />
            <path d="M5.45 58.37c4.79 0 8.5 4.16 8.5 10.24 0 8.07 0 10.87 0 18.94H9.14c-4.79 0-8.5-4.17-8.5-10.24 0-8.07 0-10.88 0-18.94h4.81z" />
            <path d="M7.3 57.39c3.66 0 6.63-2.97 6.63-6.64 0-3.66-2.97-6.63-6.63-6.63-3.67 0-6.64 2.97-6.64 6.63v6.64h6.64z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

/**
 * Pola latar berulang Batik Truntum (CC0, terinspirasi Ragam Hias Jawa Truntum).
 */
export function BatikTruntumPattern({ className = "h-full w-full" }: MotifProps) {
  const uid = useId().replace(/:/g, "");
  const pid = `truntum-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern id={pid} width="56" height="56" patternUnits="userSpaceOnUse" viewBox="0 0 56 56">
          <g fill="currentColor">
            <circle cx="28" cy="28" r="2.8" />
            <circle cx="0" cy="0" r="2.8" />
            <circle cx="56" cy="0" r="2.8" />
            <circle cx="0" cy="56" r="2.8" />
            <circle cx="56" cy="56" r="2.8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <ellipse
                key={deg}
                cx="28"
                cy="18"
                rx="2.4"
                ry="6.5"
                transform={`rotate(${deg} 28 28)`}
                fillOpacity="0.85"
              />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

/**
 * Pita pembatas horizontal motif Batik Tumpal Gigi Balang (CC0, Ragam Hias Betawi/Nusantara).
 */
export function BatikTumpalBand({ className = "h-5 w-full" }: MotifProps) {
  const uid = useId().replace(/:/g, "");
  const pid = `tumpal-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern id={pid} width="32" height="20" patternUnits="userSpaceOnUse" viewBox="0 0 108.33 181.74">
          <path
            fill="currentColor"
            d="M0 0h108.33v52.16L76.96 83.53l22.48 22.49-13.49 13.49 15.23 15.22-47.01 47.01L7.15 134.73l15.23-15.22-13.49-13.49 22.48-22.49L0 52.16V0zm54.17 14.55c14.05 0 25.44 11.39 25.44 25.45 0 14.05-11.39 25.45-25.44 25.45S28.72 54.05 28.72 40c0-14.06 11.39-25.45 25.45-25.45z"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}

/**
 * Emblem siluet jurus Pencak Silat (CC BY-SA 3.0, Wikimedia Commons).
 */
export function SilatStanceEmblem({ className = "h-12 w-12" }: MotifProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(0 240) scale(0.1 -0.1)" fill="currentColor">
        <path d="M710 2239c-64-26-112-98-112-169 0-99 80-180 178-180 108 0 191 89 182 196-10 116-139 196-248 153z" />
        <path d="M1945 1919c-457-50-674-107-726-192-35-58-15-136 36-139 23-2 887 299 912 317 22 16 8 35-25 34-15-1-103-10-197-20z" />
        <path d="M910 1863c-25-9-40-35-40-68 0-37 44-112 131-228 110-145 381-448 392-437 7 7-301 598-340 654-47 67-98 95-143 79z" />
        <path d="M592 1804c-70-35-94-76-100-169-6-89 22-192 66-244 24-29 37-35 87-42 94-13 320 15 360 45 33 24 6 33-121 40-232 13-274 31-274 120 0 58 26 88 98 115 68 24 91 57 73 103-23 62-102 75-189 32z" />
        <path d="M890 1180c-11-11-20-27-20-36 0-33 160-950 170-971 13-31 27-29 34 5 8 45 18 314 18 512 0 360-44 510-148 510-21 0-42-8-54-20z" />
      </g>
    </svg>
  );
}

/**
 * Ornamen siluet Keris Jawa (CC0, Openclipart).
 */
export function KerisOrnament({ className = "h-12 w-auto" }: MotifProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 134 515"
      aria-hidden="true"
      className={className}
    >
      <g transform="matrix(.43665 0 0 .50862 11.188 -6.4889)" fill="currentColor">
        <path d="m251.27 220.13c-26.369 11.208-52.47 26.438-81.594 29.688-15.082 5.7331-33.344 7.5252-49.531 10.594-9.0702 1.2076-24.839 0.97666-30.504 4.1804-1.3332 0.75407 0.95523 1.9536 0.51698 3.1148-1.0344 2.7406 2.523 7.8501 7.7262 13.124-22.107 21.9 10.143 40.698 22.604 57.956 11.934 21.499 10.136 48.29 4.9949 71.467-5.1137 29.104-8.1286 60.408 0.38221 88.956 7.2383 22.02 24.408 45.263 17.217 70.359-7.4635 24.039-19.533 48.726-15.844 74.562 1.2515 24.445 17.401 44.382 22.12 67.763 2.741 28.812-21.922 54.199-12.557 82.893 0.57741 23.61 24.504 43.593 12.281 67.531-8.9676 23.098-5.8938 47.874 3.7188 70.469 7.7413 13.296 0.13856 51.649 15.891 50.939 10.104-22.676 6.9719-50.174-1.2892-73.096-7.1382-26.842 18.788-48.663 12.097-75.833-3.9427-22.182-20.152-42.91-8.3409-65.954 16.811-26.401 23.594-59.561 8.798-88.557-11.627-21.822-10.659-47.926 1.5549-69.314 9.746-23.577 14.589-50.122 5.8202-74.686-5.3722-24.609-22.163-46.462-19.738-72.451 0.43485-26.086 19.784-48.154 16.975-75.023 7.6499-38.546-5.0486-83.852 22.42-116.53 8.2929-19.22 27.288-22.3 35.438-37.719 3.6665 0.72781 16.964-14.053 8.8438-14.438zm-154.94 72.312c-14.509 15.067 24.84 21.861 10.844 7.8438-0.93333-6.054-17.039 9.8096-10.844-7.8438z" />
        <path d="m63.281 55.781c-13.277-0.05536-24.817 9.705-30 21.531-5.1521 7.0135-7.2061 15.764-4.6562 24.219 5.3914 12.341 19.192 16.255 30.375 21.531 7.6442 3.313 17.997 1.09 23.344 8.8438 3.0004 7.7729 9.2039 13.36 12.562 20.75 4.8869 6.6853 5.4254 14.552 8.0938 22.625 0.69391 8.9031 2.6425 17.444 4.4062 26.031 1.6004 8.8006-1.8558 16.505-5.9688 23.875-2.6847 6.9206-3.0119 16.827 5.3438 19.438 5.1948 6.609 14.438 7.4506 20.688 12.594 3.4159 3.4083 7.9983 0.6399 12.125 0.46875l21.6-3.43c-4.013-6.828 10.486-13.068 12.969-20.281 6.9064-6.0591 6.3298-16.339 0.375-22.781-6.6286-3.8869-10.412-10.619-14.594-16.469-7.0292-7.1383-7.6402-17.754-11.469-26.719-3.3567-10.993-4.2022-22.681-7.7188-33.594-3.1031-8.7365-5.1009-18.139-10.844-25.75-12.187-17.574-25.803-34.563-42.5-48.062-6.3363-5.5202-15.017-4.7195-22.812-4.7812-0.43173-0.02244-0.88421-0.02946-1.3125-0.03125z" />
      </g>
    </svg>
  );
}

/**
 * Emblem Candi Borobudur / Pendopo Nusantara (MIT, Hugeicons).
 */
export function BorobudurEmblem({ className = "h-8 w-8" }: MotifProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M20 19H4a2 2 0 0 0-2 2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1a2 2 0 0 0-2-2M14 7l-.804-4.02a1.22 1.22 0 0 0-2.392 0L10 7m10 12l-1.864-7.455c-.546-2.183-.818-3.274-1.632-3.91C15.69 7 14.565 7 12.315 7h-.63c-2.25 0-3.375 0-4.189.635c-.814.636-1.087 1.727-1.632 3.91L4 19m8-8.5v1m3 2.5v1m-6-1v1"
      />
    </svg>
  );
}
