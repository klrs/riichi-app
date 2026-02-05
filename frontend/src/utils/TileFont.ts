const tileModules = import.meta.glob<string>("../assets/tiles/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const tileSvgMap: Record<string, string> = {};
for (const [path, url] of Object.entries(tileModules)) {
  const filename = path.split("/").pop()?.replace(".svg", "");
  if (filename) {
    tileSvgMap[filename] = url;
  }
}

export const tileCodeToSvg = (code: string): string | null => {
  return tileSvgMap[code] ?? null;
};
