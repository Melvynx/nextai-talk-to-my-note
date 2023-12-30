/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Typography } from "../ui/typography";

export const SiteConfig = {
  maker: {
    image: "https://melvynx.com/images/me/twitter-en.jpg",
    website: "https://melvynx.com",
    twitter: "https://twitter.com/melvyn_me",
    name: "Melvynx",
  },
} as const;

export const Maker = () => {
  return (
    <div className="flex w-fit items-center gap-2 rounded-full border bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 py-2  font-bold transition-all hover:brightness-110">
      <img
        className="h-12 w-12 rounded-full border border-gray-500/50"
        src={SiteConfig.maker.image}
        alt="my face"
      />
      <div className="flex flex-col gap-0">
        <Typography variant="large">
          Made by{" "}
          <Link
            className="font-extrabold text-blue-500 hover:underline"
            href="https://melvynx.com"
          >
            {SiteConfig.maker.name}
          </Link>
        </Typography>
        <Link
          href={SiteConfig.maker.twitter}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          Follow me on Twitter
        </Link>
      </div>
    </div>
  );
};
