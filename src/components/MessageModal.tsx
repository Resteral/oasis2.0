"use client";
import { useState } from 'react';
import styles from './MessageModal.module.css';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
    theme?: { primaryColor?: string; backgroundColor?: string };
}

export default function MessageModal({ isOpen, onClose, businessId, businessName, theme }: MessageModalProps) {
    const [contactInfo, setContactInfo] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const primaryColor = theme?.primaryColor || '#000000';

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactInfo || !content) return;

        setSending(true);

        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    customer_contact: contactInfo,
                    content
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setContactInfo('');
                setContent('');
                onClose();
            }, 2000);
        } catch (error: any) {
            alert(error.message || 'Error sending message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header} style={{ borderBottomColor: primaryColor }}>
                    <h2 className={styles.title}>Message {businessName}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {success ? (
                    <div className={styles.successState}>
                        <div className={styles.checkIcon} style={{ color: primaryColor }}>✓</div>
                        <p>Message sent successfully!</p>
                        <p className={styles.subtext}>They will reach out to you shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className={styles.form}>
                        <p className={styles.description}>Have a question? Send a direct message to the store owner.</p>

                        <div className={styles.field}>
                            <label>Your Phone Number or Handle *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. 555-0123 or @johndoe"
                                value={contactInfo}
                                onChange={e => setContactInfo(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Message *</label>
                            <textarea
                                className="input"
                                rows={4}
                                placeholder="What would you like to ask?"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor, width: '100%' }}
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
