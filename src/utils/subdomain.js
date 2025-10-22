/**
 * Subdomain utilities for multi-tenant family tree application
 * Handles subdomain extraction and URL generation for familywall.in
 */

const MAIN_DOMAIN = 'familywall.in';
const LOCALHOST_PATTERN = /^localhost(:\d+)?$/;

/**
 * Extract subdomain from the current hostname
 * Examples:
 *   smith.familywall.in -> 'smith'
 *   localhost:3000 -> null (root/registration page)
 *   smith.localhost:3000 -> 'smith' (local testing)
 */
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Handle localhost for development
  if (LOCALHOST_PATTERN.test(hostname)) {
    return null; // Root domain (registration page)
  }
  
  // Handle localhost with subdomain for testing (e.g., smith.localhost)
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    return parts.length > 1 ? parts[0] : null;
  }
  
  // Handle production domain
  if (hostname.endsWith(MAIN_DOMAIN)) {
    const parts = hostname.split('.');
    // subdomain.familywall.in -> ['subdomain', 'familywall', 'in']
    if (parts.length === 3) {
      return parts[0];
    }
    return null; // Just familywall.in (root domain)
  }
  
  // Unknown domain format
  return null;
};

/**
 * Check if we're on the root domain (registration page)
 */
export const isRootDomain = () => {
  return getSubdomain() === null;
};

/**
 * Generate full URL for a given subdomain
 */
export const generateSubdomainUrl = (subdomain) => {
  // Ensure subdomain is a string
  if (!subdomain || typeof subdomain !== 'string') {
    console.error('Invalid subdomain:', subdomain);
    return null;
  }

  const protocol = window.location.protocol; // http: or https:
  const port = window.location.port;
  const hostname = window.location.hostname;
  
  // Development (localhost) - check if current hostname is localhost or ends with .localhost
  const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');
  
  if (isLocalhost) {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${subdomain}.localhost${portSuffix}`;
  }
  
  // Production
  return `${protocol}//${subdomain}.${MAIN_DOMAIN}`;
};

/**
 * Redirect to a family's subdomain
 * Always redirects to root of subdomain (not /register)
 */
export const redirectToSubdomain = (subdomain) => {
  if (!subdomain) {
    console.error('Cannot redirect: subdomain is missing');
    return;
  }
  
  const url = generateSubdomainUrl(subdomain);
  
  if (url) {
    // Force full page reload to ensure we're at the root of the subdomain
    window.location.replace(url);
  } else {
    console.error('Failed to generate URL for subdomain:', subdomain);
  }
};

/**
 * Get the root domain URL (for registration)
 */
export const getRootDomainUrl = () => {
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Development
  if (LOCALHOST_PATTERN.test(window.location.hostname) || window.location.hostname.includes('localhost')) {
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//localhost${portSuffix}`;
  }
  
  // Production
  return `${protocol}//${MAIN_DOMAIN}`;
};

/**
 * Validate subdomain format
 * Must be lowercase alphanumeric with hyphens, 3-50 characters
 */
export const isValidSubdomain = (subdomain) => {
  if (!subdomain || typeof subdomain !== 'string') return false;
  
  // Must be 3-50 characters, lowercase letters, numbers, and hyphens
  // Cannot start or end with a hyphen
  const regex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
  return regex.test(subdomain);
};

/**
 * Get current context (root or family)
 */
export const getCurrentContext = () => {
  const subdomain = getSubdomain();
  
  return {
    isRoot: subdomain === null,
    subdomain: subdomain,
    fullUrl: window.location.href,
    hostname: window.location.hostname
  };
};

const subdomainUtils = {
  getSubdomain,
  isRootDomain,
  generateSubdomainUrl,
  redirectToSubdomain,
  getRootDomainUrl,
  isValidSubdomain,
  getCurrentContext
};

export default subdomainUtils;
