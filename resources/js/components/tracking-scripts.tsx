import { useEffect } from 'react';

interface TrackingScriptsProps {
    establishment: {
        facebook_pixel_id?: string | null;
        google_analytics_id?: string | null;
        google_tag_id?: string | null;
    };
}

export default function TrackingScripts({ establishment }: TrackingScriptsProps) {
    useEffect(() => {
        // Google Tag Manager
        if (establishment.google_tag_id) {
            const gtmScript = document.createElement('script');
            gtmScript.async = true;
            gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${establishment.google_tag_id}`;
            document.head.appendChild(gtmScript);

            // GTM Data Layer
            (window as any).dataLayer = (window as any).dataLayer || [];
            (window as any).dataLayer.push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
            });
        }

        // Google Analytics (GA4)
        if (establishment.google_analytics_id) {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${establishment.google_analytics_id}`;
            document.head.appendChild(gaScript);

            // gtag function
            (window as any).gtag = function() {
                (window as any).dataLayer = (window as any).dataLayer || [];
                (window as any).dataLayer.push(arguments);
            };
            (window as any).gtag('js', new Date());
            (window as any).gtag('config', establishment.google_analytics_id);
        }

        // Facebook Pixel
        if (establishment.facebook_pixel_id) {
            const fbPixelScript = document.createElement('script');
            fbPixelScript.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${establishment.facebook_pixel_id}');
                fbq('track', 'PageView');
            `;
            document.head.appendChild(fbPixelScript);

            // Noscript fallback
            const noscript = document.createElement('noscript');
            noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${establishment.facebook_pixel_id}&ev=PageView&noscript=1" />`;
            document.body.appendChild(noscript);
        }

        return () => {
            // Cleanup function to remove scripts when component unmounts
            const scripts = document.querySelectorAll('script[src*="googletagmanager"], script[src*="facebook"]');
            scripts.forEach(script => script.remove());
        };
    }, [establishment.facebook_pixel_id, establishment.google_analytics_id, establishment.google_tag_id]);

    // Google Tag Manager noscript fallback
    useEffect(() => {
        if (establishment.google_tag_id) {
            const noscript = document.createElement('noscript');
            noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${establishment.google_tag_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
            document.body.appendChild(noscript);

            return () => {
                const noscripts = document.querySelectorAll('noscript iframe[src*="googletagmanager"]');
                noscripts.forEach(ns => ns.parentElement?.remove());
            };
        }
    }, [establishment.google_tag_id]);

    return null; // This component doesn't render anything visible
}

// Helper functions for tracking events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    // Google Analytics event
    if ((window as any).gtag) {
        (window as any).gtag('event', eventName, parameters);
    }

    // Facebook Pixel event
    if ((window as any).fbq) {
        (window as any).fbq('track', eventName, parameters);
    }

    // GTM event
    if ((window as any).dataLayer) {
        (window as any).dataLayer.push({
            event: eventName,
            ...parameters
        });
    }
};

export const trackPageView = (pagePath?: string) => {
    // Google Analytics page view
    if ((window as any).gtag) {
        (window as any).gtag('config', (window as any).ga_tracking_id, {
            page_path: pagePath
        });
    }

    // Facebook Pixel page view
    if ((window as any).fbq) {
        (window as any).fbq('track', 'PageView');
    }
};

export const trackPurchase = (value: number, currency = 'BRL') => {
    trackEvent('Purchase', {
        value,
        currency,
        event_category: 'ecommerce'
    });
};

export const trackAddToCart = (value: number, currency = 'BRL', itemName?: string) => {
    trackEvent('AddToCart', {
        value,
        currency,
        content_name: itemName,
        event_category: 'ecommerce'
    });
};

export const trackInitiateCheckout = (value: number, currency = 'BRL') => {
    trackEvent('InitiateCheckout', {
        value,
        currency,
        event_category: 'ecommerce'
    });
};