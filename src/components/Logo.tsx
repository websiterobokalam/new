/**
 * The official Robokalam logo and icon, from the original robokalam.com brand
 * files (public/brand). Never redrawn: these are the real images.
 * On dark backgrounds the wordmark turns white and the globe sits on a white disc.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string; spin?: boolean }) {
  return <img src="/brand/robokalam-icon-128.png" alt="" aria-hidden="true" width={128} height={128} className={className} />;
}

export function Wordmark({ tone = "auto" }: { tone?: "auto" | "light" }) {
  const size = "h-9 w-auto sm:h-11 lg:h-12";
  if (tone === "light") {
    return <img src="/brand/robokalam-logo-dark-400.png" srcSet="/brand/robokalam-logo-dark-400.png 400w, /brand/robokalam-logo-dark.png 788w" sizes="200px" width={400} height={95} alt="Robokalam, literature of technologies" className={size} />;
  }
  return (
    <>
      <img src="/brand/robokalam-logo-400.png" srcSet="/brand/robokalam-logo-400.png 400w, /brand/robokalam-logo.png 788w" sizes="200px" width={400} height={95} alt="Robokalam, literature of technologies" className={`${size} dark:hidden`} />
      <img src="/brand/robokalam-logo-dark-400.png" srcSet="/brand/robokalam-logo-dark-400.png 400w, /brand/robokalam-logo-dark.png 788w" sizes="200px" width={400} height={95} alt="Robokalam, literature of technologies" className={`${size} hidden dark:block`} />
    </>
  );
}
