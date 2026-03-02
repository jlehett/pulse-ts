import { useFrameUpdate, useDestroy } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOnPeerLeave } from '@pulse-ts/network';

export interface DisconnectOverlayNodeProps {
    /** Whether the local player is the host. Determines the disconnect message. */
    isHost: boolean;
    /** Callback invoked when the player clicks "Main Menu". */
    onRequestMenu?: () => void;
}

/**
 * DOM overlay that appears when the remote player disconnects from an
 * online match. Shows a contextual message ("Host ended the match" or
 * "The other player left the match") with a button to return to the
 * main menu.
 */
export function DisconnectOverlayNode(
    props: Readonly<DisconnectOverlayNodeProps>,
) {
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    let disconnected = false;

    useOnPeerLeave(() => {
        disconnected = true;
    });

    // Dark semi-transparent backdrop
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '5000',
        backgroundColor: 'rgba(0,0,0,0.7)',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(backdrop);

    // Disconnect message
    const text = document.createElement('div');
    Object.assign(text.style, {
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '5001',
        font: 'bold 36px monospace',
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '0 0 20px rgba(0,0,0,0.9)',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    text.textContent = props.isHost
        ? 'The other player left the match'
        : 'Host ended the match';
    container.appendChild(text);

    // Main Menu button
    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Main Menu';
    Object.assign(menuBtn.style, {
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '5001',
        font: 'bold 18px monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        cursor: 'pointer',
        transition: 'all 0.2s ease, opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    menuBtn.addEventListener('mouseenter', () => {
        menuBtn.style.backgroundColor = 'rgba(255,255,255,0.15)';
        menuBtn.style.borderColor = '#48c9b0';
        menuBtn.style.boxShadow = '0 0 12px #48c9b044';
    });
    menuBtn.addEventListener('mouseleave', () => {
        menuBtn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        menuBtn.style.borderColor = 'rgba(255,255,255,0.2)';
        menuBtn.style.boxShadow = 'none';
    });
    menuBtn.addEventListener('click', () => {
        props.onRequestMenu?.();
    });
    container.appendChild(menuBtn);

    useFrameUpdate(() => {
        backdrop.style.opacity = disconnected ? '1' : '0';
        text.style.opacity = disconnected ? '1' : '0';
        menuBtn.style.opacity = disconnected ? '1' : '0';
        backdrop.style.pointerEvents = disconnected ? 'auto' : 'none';
        menuBtn.style.pointerEvents = disconnected ? 'auto' : 'none';
    });

    useDestroy(() => {
        backdrop.remove();
        text.remove();
        menuBtn.remove();
    });
}
