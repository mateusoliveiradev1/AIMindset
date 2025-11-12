export type NewsletterLogStatus = 'success' | 'error' | 'pending' | 'failed';

export const isValidLogStatus = (status: string): status is NewsletterLogStatus => {
  return ['success', 'error', 'pending', 'failed'].includes(status);
};

export const ensureValidLogStatus = (status: string): NewsletterLogStatus => {
  if (!isValidLogStatus(status)) {
    throw new Error('Invalid newsletter log status');
  }
  return status as NewsletterLogStatus;
};

