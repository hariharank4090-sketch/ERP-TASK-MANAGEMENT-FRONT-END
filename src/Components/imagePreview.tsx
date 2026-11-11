import React, { useState, type ReactNode } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface ImagePreviewDialogProps {
  /** The URL of the image or video to preview */
  url: string;
  /** Child elements that will trigger the dialog when clicked */
  children: ReactNode;
  /** Optional className for the trigger element */
  triggerClassName?: string;
  /** Optional custom title for the dialog */
  dialogTitle?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const isVideoUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    /\.(mp4|webm|ogv|mov|avi|mkv|m4v|3gp|wmv|flv)$/i.test(cleanUrl) ||
    url.startsWith('data:video/')
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const isAudioUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    /\.(mp3|wav|ogg|oga|m4a|aac|weba|flac|opus|wma)$/i.test(cleanUrl) ||
    url.startsWith('data:audio/')
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const isDocumentUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    /\.(pdf|txt|csv|doc|docx|xls|xlsx|ppt|pptx)$/i.test(cleanUrl) ||
    url.startsWith('data:application/pdf') ||
    url.startsWith('data:text/')
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const resolveMediaUrl = (rawUrl?: string | null): string | undefined => {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined' ||
    trimmed.includes('imageNotFound')
  ) {
    return undefined;
  }

  const normalized = trimmed.replace(/\\/g, '/');

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('blob:')
  ) {
    if (
      typeof window !== 'undefined' &&
      window.location.port === '5173' &&
      normalized.includes('localhost:5173/') &&
      !normalized.includes('localhost:5173/api/')
    ) {
      return normalized.replace('localhost:5173/', 'localhost:5001/');
    }
    return normalized;
  }

  const apiEnv = import.meta.env.VITE_API_URL;
  if (apiEnv && (apiEnv.startsWith('http://') || apiEnv.startsWith('https://'))) {
    try {
      const origin = new URL(apiEnv).origin;
      return `${origin}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
    } catch {
      // ignore invalid URL
    }
  }

  if (
    typeof window !== 'undefined' &&
    window.location.port === '5173' &&
    !normalized.startsWith('/api/')
  ) {
    return `${window.location.protocol}//${window.location.hostname}:5001${
      normalized.startsWith('/') ? '' : '/'
    }${normalized}`;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = (props) => {
  const [open, setOpen] = useState<boolean>(false);
  const { 
    url, 
    children, 
    dialogTitle,
    triggerClassName 
  } = props;

  const mediaUrl = resolveMediaUrl(url) || url;
  const isVideo = isVideoUrl(mediaUrl);
  const isAudio = isAudioUrl(mediaUrl);
  const isDoc = isDocumentUrl(mediaUrl);
  const resolvedTitle =
    dialogTitle ??
    (isVideo ? 'Video Preview' : isAudio ? 'Audio Preview' : isDoc ? 'Attachment Preview' : 'Image Preview');

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  return (
    <span>
      <Tooltip title="Click to open">
        <span 
          onClick={handleOpen} 
          className={triggerClassName}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleOpen();
            }
          }}
        >
          {children}
        </span>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="lg"
        aria-labelledby="image-preview-dialog-title"
      >
        <DialogTitle 
          className="bg-dark text-white d-flex justify-content-between"
          id="image-preview-dialog-title"
        >
          <span>{resolvedTitle}</span>
          <IconButton 
            onClick={handleClose} 
            aria-label="close"
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent className="bg-dark pb-4 d-flex align-items-center justify-content-center">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          ) : isAudio ? (
            <audio
              src={mediaUrl}
              controls
              autoPlay
              style={{
                width: '100%',
                maxWidth: 480
              }}
            />
          ) : isDoc ? (
            <iframe
              src={mediaUrl}
              title="Attachment Preview"
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                backgroundColor: '#fff',
                borderRadius: 6
              }}
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh',
                objectFit: 'contain'
              }} 
              loading="lazy"
            />
          )}
        </DialogContent>
      </Dialog>
    </span>
  );
};

export default ImagePreviewDialog;
