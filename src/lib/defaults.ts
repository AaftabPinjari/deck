
// Default Gradient Covers
export const DEFAULT_COVERS = [
    "linear-gradient(to right, #ff7e5f, #feb47b)", // Sunset
    "linear-gradient(to right, #8360c3, #2ebf91)", // Purple Green
    "linear-gradient(to right, #00c6ff, #0072ff)", // Blue
    "linear-gradient(to right, #11998e, #38ef7d)", // Green
    "linear-gradient(to right, #FC466B, #3F5EFB)", // Rose Blue
    "linear-gradient(to right, #c94b4b, #4b134f)", // Deep Purple
    "linear-gradient(to right, #2193b0, #6dd5ed)", // Cool Blue
    "linear-gradient(to right, #cc2b5e, #753a88)"  // Magenta Purple
];

// Default Icons (Common Notion-style emojis)
export const DEFAULT_ICONS = [
    "📄", "📝", "💡", "✨", "🚀", "🎨", "📚", "📌", "🎯", "⭐",
    "🌊", "🏔️", "🌅", "💻", "🧠", "🎒", "📅", "📊", "🔥", "💭"
];

export const getRandomCover = (): string => {
    return DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];
};

export const getRandomIcon = (): string => {
    return DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)];
};
