"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Button, Grid, Paper, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Download as DownloadIcon } from "lucide-react";
import QRCode from "react-qr-code";
import * as htmlToImage from "html-to-image";
import { toast } from "react-toastify";

type Banner = {
  id: string;
  title: string;
  htmlTemplate: string;
};

const SAMPLE_BANNERS: Banner[] = [
  {
    id: "b1",
    title: "Banner (300 x 180)",
    htmlTemplate: `<a href="__AFF_LINK__" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/300x180?text=Banner+300x180" alt="Banner"></a>`,
  },
  {
    id: "b2",
    title: "Banner (336 x 280)",
    htmlTemplate: `<a href="__AFF_LINK__" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/336x280?text=Banner+336x280" alt="Banner"></a>`,
  },
  {
    id: "b3",
    title: "Banner (335 x 332)",
    htmlTemplate: `<a href="__AFF_LINK__" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/335x332?text=Banner+335x332" alt="Banner"></a>`,
  },
];

interface Props {
  affiliateCode?: string | null;
}

const AffiliateBanners: React.FC<Props> = ({ affiliateCode }) => {
  const qrRef = useRef<HTMLDivElement | null>(null);

  const affiliateLinkDefault = `https://swingsocial.co?aff=${encodeURIComponent(
    affiliateCode || "DEMO123",
  )}`;

  const [affiliateLink, setAffiliateLink] =
    useState<string>(affiliateLinkDefault);

  useEffect(() => {
    setAffiliateLink(
      `https://swingsocial.co?aff=${encodeURIComponent(
        affiliateCode || "DEMO123",
      )}`,
    );
  }, [affiliateCode]);

  const banners = useMemo(() => {
    return SAMPLE_BANNERS.map((b) => ({
      ...b,
      html: b.htmlTemplate.replace(/__AFF_LINK__/g, affiliateLinkDefault),
    }));
  }, [affiliateLinkDefault]);

  const downloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(qrRef.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `affiliate-qr-${affiliateCode}.png`;
      link.click();
      toast.success("QR downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <>
      <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="stretch">
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Link to Us - Banners & Links
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  QR Code (embedded with referral)
                </Typography>
                <Box
                  sx={{ display: "flex", justifyContent: "center", p: 1 }}
                  ref={qrRef}
                >
                  <QRCode value={affiliateLink} size={140} />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon size={14} />}
                  onClick={() => downloadQR()}
                  fullWidth
                  sx={{ mt: 1, textTransform: "none" }}
                >
                  Download
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Copy and paste any of the following HTML code to display the
                banner on your site or blog. The referral code is embedded in
                the link.
              </Typography>

              <Grid container spacing={2} sx={{ paddingBottom: "50px" }}>
                {banners.map((b) => (
                  <Grid item xs={12} md={6} key={b.id}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {b.title}
                      </Typography>

                      <Box
                        sx={{ mb: 1 }}
                        dangerouslySetInnerHTML={{ __html: b.html }}
                      />

                      <TextField
                        value={b.html}
                        multiline
                        rows={3}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 1 }}
                      />

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => copyToClipboard(b.html)}
                          startIcon={<ContentCopyIcon />}
                          sx={{ textTransform: "none", flex: 1 }}
                        >
                          Copy HTML
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => copyToClipboard(affiliateLink)}
                          sx={{ textTransform: "none", flex: 1 }}
                        >
                          Copy Link
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </>
  );
};

export default AffiliateBanners;
