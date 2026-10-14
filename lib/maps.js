/**
 * Utility to parse and format Google Maps URLs provided by admins.
 * Handles:
 * - Direct iframe embed snippets: <iframe src="https://www.google.com/maps/embed?..." ...></iframe>
 * - Official Google Maps embed URLs: https://www.google.com/maps/embed?...
 * - Google Maps Place URLs: https://www.google.com/maps/place/Name+Or+Address/@18.5204,73.8567,...
 * - Google Maps query links: https://maps.google.com/?q=... or https://www.google.com/maps?q=...
 * - Shortened share links: https://maps.app.goo.gl/... or https://goo.gl/maps/...
 * - Automatic search fallback using venue name, address, and city.
 */

export function parseGoogleMapUrl(input) {
  if (!input) return "";
  let url = String(input).trim();
  if (url.includes("<iframe")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) url = match[1].trim();
  }
  // Strip any wrapping quotes
  url = url.replace(/^["']+|["']+$/g, "").trim();

  // Ensure absolute protocol if admin pasted short link or google URL without https://
  if (url && !/^https?:\/\//i.test(url)) {
    if (
      url.includes("google.") ||
      url.includes("goo.gl") ||
      url.startsWith("maps.") ||
      url.startsWith("www.")
    ) {
      url = "https://" + url;
    }
  }

  return url;
}

export function getBranchMapDetails(branch) {
  if (!branch) {
    return {
      mapUrl: "https://maps.google.com",
      mapEmbedUrl: "https://maps.google.com/maps?q=India&t=&z=5&ie=UTF8&iwloc=&output=embed",
    };
  }

  const rawInput = parseGoogleMapUrl(branch.mapUrl);

  // Best fallback query including the business name so Google pins the exact venue
  const locationQuery = [branch.name, branch.address, branch.city].filter(Boolean).join(", ");
  const fallbackEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const fallbackClickUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;

  if (!rawInput) {
    return {
      mapUrl: fallbackClickUrl,
      mapEmbedUrl: fallbackEmbedUrl,
    };
  }

  // 1. Direct Embed URL (maps/embed or output=embed)
  if (rawInput.includes("/maps/embed") || rawInput.includes("output=embed")) {
    let clickUrl = fallbackClickUrl;
    // Extract coordinates from pb parameter if present (!3d<lat>!2d<lng> or !2d<lng>!3d<lat>)
    const latMatch = rawInput.match(/!3d(-?\d+(?:\.\d+)?)/);
    const lngMatch = rawInput.match(/!2d(-?\d+(?:\.\d+)?)/);
    if (latMatch && lngMatch) {
      clickUrl = `https://www.google.com/maps/search/?api=1&query=${latMatch[1]},${lngMatch[1]}`;
    } else {
      const qMatch = rawInput.match(/[?&]q=([^&]+)/);
      if (qMatch) {
        clickUrl = `https://www.google.com/maps/search/?api=1&query=${qMatch[1]}`;
      }
    }

    return {
      mapUrl: clickUrl,
      mapEmbedUrl: rawInput,
    };
  }

  // 2. Google Maps Place URL (e.g. /maps/place/PlaceName/@18.5204,73.8567...)
  if (rawInput.includes("/maps/place/")) {
    const placeMatch = rawInput.match(/\/maps\/place\/([^/@?]+)/);
    const coordMatch = rawInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    let query = "";
    if (placeMatch) {
      query = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    } else if (coordMatch) {
      query = `${coordMatch[1]},${coordMatch[2]}`;
    }

    return {
      mapUrl: rawInput,
      mapEmbedUrl: query
        ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
        : fallbackEmbedUrl,
    };
  }

  // 3. URLs with query parameters (?q= or &q= or ?query=)
  const qMatch = rawInput.match(/[?&](?:q|query)=([^&]+)/);
  if (qMatch) {
    const query = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
    return {
      mapUrl: rawInput,
      mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
    };
  }

  // 4. Shortened share links (maps.app.goo.gl or goo.gl/maps)
  // Shortlinks cannot be placed directly in <iframe> because Google blocks cross-origin framing on shortlinks.
  // The 'Open in Google Maps App' button / Map icon uses the exact shortlink provided by the admin,
  // and the iframe will embed the specific venue search with name + address + city.
  if (rawInput.includes("maps.app.goo.gl") || rawInput.includes("goo.gl/maps")) {
    return {
      mapUrl: rawInput,
      mapEmbedUrl: fallbackEmbedUrl,
    };
  }

  // 5. Standard HTTP URL
  return {
    mapUrl: rawInput.startsWith("http") ? rawInput : fallbackClickUrl,
    mapEmbedUrl: fallbackEmbedUrl,
  };
}
