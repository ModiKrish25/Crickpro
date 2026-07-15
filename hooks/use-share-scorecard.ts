/**
 * useShareScorecard Hook
 * Cross-platform hook for sharing scorecard images.
 * 
 * Platform support:
 * - iOS/Android: Uses react-native-view-shot to capture the SVG scorecard,
 *   then expo-sharing to share the image file.
 * - Web: Generates an SVG blob and triggers a download or creates a shareable URL.
 * - Fallback: React Native's built-in Share API with formatted text.
 */
import { useCallback, useRef, useState } from "react";
import { Platform, Share, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { generateScorecardText, type ShareScorecardData } from "@/components/scorecard-share";

export type ShareMethod = "image" | "text" | "download";

interface UseShareScorecardReturn {
  /** Ref to attach to the ScorecardShare wrapper View */
  scorecardRef: React.RefObject<View>;
  /** Whether a share operation is in progress */
  isSharing: boolean;
  /** Error message if sharing failed */
  shareError: string | null;
  /** Share as an image (native) or download (web) */
  shareAsImage: () => Promise<void>;
  /** Share as plain text */
  shareAsText: () => Promise<void>;
  /** Download the scorecard image (web only) */
  downloadAsImage: () => Promise<void>;
}

export function useShareScorecard(data: ShareScorecardData): UseShareScorecardReturn {
  const scorecardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const resetError = useCallback(() => setShareError(null), []);

  /**
   * Share as image: capture the scorecard view and share via native share sheet
   * On web, download the SVG as an image
   */
  const shareAsImage = useCallback(async () => {
    resetError();
    setIsSharing(true);

    try {
      if (Platform.OS === "web") {
        // On web, generate SVG and create a download
        await downloadWebImage();
      } else {
        // Native: use view-shot + expo-sharing
        if (!scorecardRef.current) {
          throw new Error("Scorecard view not ready");
        }

        const uri = await captureRef(scorecardRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });

        if (!(await Sharing.isAvailableAsync())) {
          // Fallback to text share
          await shareAsText();
          return;
        }

        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `Match Result: ${data.team1Name} vs ${data.team2Name}`,
        });
      }
    } catch (err: any) {
      console.error("Share scorecard failed:", err);
      setShareError(err.message || "Failed to share scorecard");

      // Fallback to text sharing
      try {
        await shareAsText();
      } catch {}
    } finally {
      setIsSharing(false);
    }
  }, [data, resetError]);

  /**
   * Share as formatted text using the native Share API
   */
  const shareAsText = useCallback(async () => {
    resetError();
    setIsSharing(true);

    try {
      const text = generateScorecardText(data);
      await Share.share({
        message: text,
        title: `CrickPro - ${data.team1Name} vs ${data.team2Name}`,
      });
    } catch (err: any) {
      if (err.message !== "User did not share") {
        setShareError(err.message || "Failed to share text");
      }
    } finally {
      setIsSharing(false);
    }
  }, [data, resetError]);

  /**
   * Download the scorecard as a PNG image (web only)
   */
  const downloadAsImage = useCallback(async () => {
    resetError();
    setIsSharing(true);

    try {
      if (Platform.OS !== "web") {
        // On native, share as image instead
        await shareAsImage();
        return;
      }

      await downloadWebImage();
    } catch (err: any) {
      console.error("Download scorecard failed:", err);
      setShareError(err.message || "Failed to download scorecard");
    } finally {
      setIsSharing(false);
    }
  }, [resetError]);

  /**
   * Web-specific: generate an SVG from the scorecard data and trigger download
   */
  async function downloadWebImage() {
    // Generate SVG markup string
    const svgMarkup = generateSvgMarkup(data);
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Try to use canvas to convert to PNG for better compatibility
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          downloadUrl(pngUrl, `scorecard-${data.team1Name}-vs-${data.team2Name}.png`);
          URL.revokeObjectURL(pngUrl);
        }
      }, "image/png");
    } catch {
      // Fallback: download as SVG
      downloadUrl(url, `scorecard-${data.team1Name}-vs-${data.team2Name}.svg`);
    }

    URL.revokeObjectURL(url);
  }

  function downloadUrl(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    scorecardRef,
    isSharing,
    shareError,
    shareAsImage,
    shareAsText,
    downloadAsImage,
  };
}

/**
 * Generate an SVG markup string from scorecard data (for web download)
 */
function generateSvgMarkup(data: ShareScorecardData): string {
  const c = {
    primary: "#0a7ea4",
    primaryDark: "#065f7a",
    surface: "#f8fafc",
    text: "#11181C",
    textSecondary: "#64748b",
    textLight: "#94a3b8",
    border: "#e2e8f0",
    white: "#ffffff",
    gold: "#F59E0B",
    accent: "#22C55E",
  };

  const resultColor = data.matchResult.toLowerCase().includes("won") ? "#22C55E" : "#F59E0B";
  const formattedDate = data.date || new Date().toLocaleDateString();
  const team1Score = data.team1Score || "—";
  const team2Score = data.team2Score || "—";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.primary}"/>
        <stop offset="1" stop-color="${c.primaryDark}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="${c.white}" rx="20"/>
    <rect width="600" height="180" fill="url(#h)" rx="20"/>
    <text x="28" y="38" font-size="11" font-weight="700" fill="${c.white}" opacity="0.7" letter-spacing="2">CRICKPRO</text>
    <text x="28" y="85" font-size="16" font-weight="700" fill="${c.white}" opacity="0.8">${escapeXml(data.team1Name)}</text>
    <text x="28" y="125" font-size="42" font-weight="800" fill="${c.white}">${escapeXml(team1Score)}</text>
    ${data.team1Overs ? `<text x="28" y="150" font-size="13" fill="${c.white}" opacity="0.7">${escapeXml(data.team1Overs)} overs</text>` : ""}
    <circle cx="300" cy="105" r="24" fill="${c.white}" opacity="0.15"/>
    <text x="300" y="110" font-size="13" font-weight="800" fill="${c.white}" opacity="0.9" text-anchor="middle">VS</text>
    <text x="572" y="85" font-size="16" font-weight="700" fill="${c.white}" opacity="0.8" text-anchor="end">${escapeXml(data.team2Name)}</text>
    <text x="572" y="125" font-size="42" font-weight="800" fill="${c.white}" text-anchor="end">${escapeXml(team2Score)}</text>
    ${data.team2Overs ? `<text x="572" y="150" font-size="13" fill="${c.white}" opacity="0.7" text-anchor="end">${escapeXml(data.team2Overs)} overs</text>` : ""}
    <text x="300" y="230" font-size="18" font-weight="700" fill="${resultColor}" text-anchor="middle">${escapeXml(data.matchResult)}</text>
    <text x="300" y="580" font-size="12" font-weight="700" fill="${c.primary}" text-anchor="middle">CrickPro</text>
    <text x="300" y="600" font-size="10" fill="${c.textLight}" text-anchor="middle">Generated on ${formattedDate}</text>
  </svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
