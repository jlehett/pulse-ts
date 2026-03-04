import type { AiPersonality } from './personalities';
import type { AiState } from './aiState';

/** Output of a single AI decision tick. */
export interface AiDecision {
    /** Movement input vector (x, y) in the range -1..1. */
    moveX: number;
    moveY: number;
    /** Whether the AI wants to dash this tick. */
    dash: boolean;
}

// ---------------------------------------------------------------------------
// Resolved personality (all optional fields filled with defaults)
// ---------------------------------------------------------------------------

type Resolved = Required<Omit<AiPersonality, 'name'>> & { name: string };

function resolve(p: AiPersonality): Resolved {
    return {
        name: p.name,
        approachDistance: p.approachDistance,
        aggression: p.aggression,
        edgeCaution: p.edgeCaution,
        dashRate: p.dashRate,
        erraticism: p.erraticism,
        moveSpeed: p.moveSpeed,
        preferredDistance: p.preferredDistance ?? 0,
        strafeStrength: p.strafeStrength ?? 0,
        anglePref: p.anglePref ?? 0,
        spinRate: p.spinRate ?? 0,
        jitterAmplitude: p.jitterAmplitude ?? 0,
        momentumCommitment: p.momentumCommitment ?? 0,
        centerControl: p.centerControl ?? 0,
        edgeAggression: p.edgeAggression ?? 0,
        edgeRiding: p.edgeRiding ?? 0,
        herding: p.herding ?? 0,
        territoriality: p.territoriality ?? 0,
        mirrorTendency: p.mirrorTendency ?? 0,
        copycat: p.copycat ?? 0,
        predictionStrength: p.predictionStrength ?? 0,
        dashDirection: p.dashDirection ?? 1,
        dodgeReflex: p.dodgeReflex ?? 0,
        counterDashRate: p.counterDashRate ?? 0,
        sacrificialDash: p.sacrificialDash ?? 0,
        respectMomentum: p.respectMomentum ?? 0,
        patience: p.patience ?? 0,
        burstiness: p.burstiness ?? 0,
        feintRate: p.feintRate ?? 0,
        ambushTendency: p.ambushTendency ?? 0,
        commitWindow: p.commitWindow ?? 0,
        rhythmPeriod: p.rhythmPeriod ?? 0,
        retreatAfterHit: p.retreatAfterHit ?? 0,
        grudgeIntensity: p.grudgeIntensity ?? 0,
        bounceChasing: p.bounceChasing ?? 0,
        postHitPause: p.postHitPause ?? 0,
        desperationThreshold: p.desperationThreshold ?? 0,
        overconfidence: p.overconfidence ?? 0,
        showboating: p.showboating ?? 0,
        panicFactor: p.panicFactor ?? 0,
        phaseShift: p.phaseShift ?? 0,
        reactionDelay: p.reactionDelay ?? 0,
    };
}

// ---------------------------------------------------------------------------
// Main decision function
// ---------------------------------------------------------------------------

/**
 * Compute one tick of AI decision-making.
 *
 * Accepts an optional {@link AiState} for stateful behaviors (grudge,
 * ambush, rhythm, etc.). When called without state, all stateful
 * knobs are inactive and the function behaves like the original
 * three-influence blending.
 *
 * @param personality - AI personality parameters.
 * @param state - Frame-to-frame mutable state (null for stateless mode).
 * @param selfX - AI player's X position.
 * @param selfZ - AI player's Z position.
 * @param opponentX - Opponent's X position.
 * @param opponentZ - Opponent's Z position.
 * @param arenaRadius - Radius of the circular arena platform.
 * @param dt - Time step in seconds (for dash probability scaling).
 * @param random - Random value in [0, 1) for deterministic testing.
 * @returns The AI's movement and dash decision for this tick.
 *
 * @example
 * ```ts
 * const decision = computeAiDecision(BRAWLER, state, 0, 0, 5, 5, 14, 1/60, Math.random());
 * input.holdAxis2D('aiMove', { x: decision.moveX, y: decision.moveY });
 * ```
 */
export function computeAiDecision(
    personality: AiPersonality,
    state: AiState | null,
    selfX: number,
    selfZ: number,
    opponentX: number,
    opponentZ: number,
    arenaRadius: number,
    dt: number,
    random: number,
): AiDecision {
    const p = resolve(personality);

    // Reaction delay — smooth perceived opponent position
    let percOpX = opponentX;
    let percOpZ = opponentZ;
    if (state && p.reactionDelay > 0) {
        const smoothing = 1 - p.reactionDelay;
        const rate = smoothing * 15; // higher = faster tracking
        state.perceivedOpX +=
            (opponentX - state.perceivedOpX) * clamp01(rate * dt);
        state.perceivedOpZ +=
            (opponentZ - state.perceivedOpZ) * clamp01(rate * dt);
        percOpX = state.perceivedOpX;
        percOpZ = state.perceivedOpZ;
    }

    // ---- Core geometry ----
    const chaseX = percOpX - selfX;
    const chaseZ = percOpZ - selfZ;
    const chaseDist = Math.sqrt(chaseX * chaseX + chaseZ * chaseZ);
    let nChaseX = 0;
    let nChaseZ = 0;
    if (chaseDist > 0.1) {
        nChaseX = chaseX / chaseDist;
        nChaseZ = chaseZ / chaseDist;
    }

    const distFromCenter = Math.sqrt(selfX * selfX + selfZ * selfZ);
    const edgeProximity = clamp01(distFromCenter / arenaRadius);
    let nCenterX = 0;
    let nCenterZ = 0;
    if (distFromCenter > 0.1) {
        nCenterX = -selfX / distFromCenter;
        nCenterZ = -selfZ / distFromCenter;
    }

    // ---- Phase 1: Apply game-state modifiers to personality ----
    let aggression = p.aggression;
    let erraticism = p.erraticism;
    let dashRateEff = p.dashRate;
    let moveSpeedEff = p.moveSpeed;

    if (state) {
        // Desperation — boost aggression and speed when behind
        if (p.desperationThreshold > 0) {
            const scoreDiff = state.opponentScore - state.selfScore;
            if (scoreDiff > 0) {
                const boost = clamp01(scoreDiff * p.desperationThreshold * 0.5);
                aggression = clamp01(aggression + boost);
                dashRateEff *= 1 + boost * 0.8;
                moveSpeedEff = Math.min(1.0, moveSpeedEff + boost * 0.15);
            }
        }

        // Overconfidence — relax when ahead
        if (p.overconfidence > 0) {
            const scoreLead = state.selfScore - state.opponentScore;
            if (scoreLead > 0) {
                const relax = clamp01(scoreLead * p.overconfidence * 0.2);
                aggression = clamp01(aggression - relax);
                erraticism = clamp01(erraticism + relax * 0.5);
            }
        }

        // Grudge — temporarily boost aggression after being hit
        if (p.grudgeIntensity > 0 && state.timeSinceCollision < 3) {
            const grudgeFade = 1 - state.timeSinceCollision / 3;
            aggression = clamp01(aggression + p.grudgeIntensity * grudgeFade);
            dashRateEff *= 1 + p.grudgeIntensity * grudgeFade * 0.5;
        }

        // Panic — degrade behavior under pressure
        if (p.panicFactor > 0) {
            const scoreDiff = state.opponentScore - state.selfScore;
            const pressure = clamp01(
                edgeProximity * 0.7 + (scoreDiff > 0 ? scoreDiff * 0.15 : 0),
            );
            const panicAmount = pressure * p.panicFactor;
            erraticism = clamp01(erraticism + panicAmount * 0.4);
            moveSpeedEff *= 1 - panicAmount * 0.2;
        }

        // Rhythm — oscillate aggression over time
        if (p.rhythmPeriod > 0) {
            const wave = Math.sin(
                (state.rhythmPhase * (2 * Math.PI)) / p.rhythmPeriod,
            );
            aggression = clamp01(aggression + wave * 0.25);
        }

        // Phase shift — swap between aggressive and defensive modes
        if (p.phaseShift > 0) {
            const period = 5 + (1 - p.phaseShift) * 10; // 5–15s period
            if (state.phaseTimer > period) {
                state.phaseTimer = 0;
                state.phaseIndex = 1 - state.phaseIndex;
            }
            if (state.phaseIndex === 1) {
                // Defensive mode
                aggression *= 1 - p.phaseShift * 0.5;
                dashRateEff *= 1 - p.phaseShift * 0.4;
            }
        }

        // Showboating — flashy behavior when ahead
        if (p.showboating > 0) {
            const lead = state.selfScore - state.opponentScore;
            if (lead > 0) {
                const showFactor = clamp01(lead * p.showboating * 0.3);
                erraticism = clamp01(erraticism + showFactor * 0.3);
            }
        }
    }

    // ---- Phase 2: Compute direction influences ----
    let dirX = 0;
    let dirZ = 0;

    // 2a. Chase / preferred distance
    if (p.preferredDistance > 0) {
        const distError = chaseDist - p.preferredDistance;
        const chaseFactor = clamp(distError / p.preferredDistance, -1, 1);
        dirX += nChaseX * aggression * chaseFactor;
        dirZ += nChaseZ * aggression * chaseFactor;
    } else {
        dirX += nChaseX * aggression;
        dirZ += nChaseZ * aggression;
    }

    // 2b. Angle preference — rotate chase direction
    if (p.anglePref > 0) {
        const angleOffset = p.anglePref * (Math.PI / 2); // 0–90°
        const cosA = Math.cos(angleOffset);
        const sinA = Math.sin(angleOffset);
        const rotX = nChaseX * cosA - nChaseZ * sinA;
        const rotZ = nChaseX * sinA + nChaseZ * cosA;
        dirX += rotX * aggression * p.anglePref * 0.5;
        dirZ += rotZ * aggression * p.anglePref * 0.5;
    }

    // 2c. Strafe — perpendicular to chase direction
    if (p.strafeStrength > 0) {
        const strafeX = -nChaseZ; // 90° rotation
        const strafeZ = nChaseX;
        dirX += strafeX * p.strafeStrength * 0.7;
        dirZ += strafeZ * p.strafeStrength * 0.7;
    }

    // 2d. Spin — add circular overlay to movement (spiral toward opponent)
    // Fade near edges to prevent spiraling off the platform
    if (p.spinRate > 0 && state) {
        const spinEdgeFade = clamp01(1 - (edgeProximity - 0.4) * 2.5);
        const effectiveSpin = p.spinRate * spinEdgeFade;
        if (effectiveSpin > 0.01) {
            const spinAngle = state.elapsed * effectiveSpin * 4;
            dirX += Math.cos(spinAngle) * effectiveSpin * 0.6;
            dirZ += Math.sin(spinAngle) * effectiveSpin * 0.6;
        }
    }

    // 2e. Center pull — edge avoidance (cubic curve for sharper edge response)
    const edgePull = edgeProximity * edgeProximity * edgeProximity;
    const centerWeight = p.edgeCaution * edgePull * 1.5;
    dirX += nCenterX * centerWeight;
    dirZ += nCenterZ * centerWeight;

    // Emergency edge pull — all AIs avoid falling off regardless of personality
    if (edgeProximity > 0.75) {
        const emergency = (edgeProximity - 0.75) * 4; // 0→1 over 0.75→1.0
        const emergencyForce = emergency * emergency * 2.0;
        dirX += nCenterX * emergencyForce;
        dirZ += nCenterZ * emergencyForce;
    }

    // 2f. Center control — always pull toward center
    if (p.centerControl > 0) {
        dirX += nCenterX * p.centerControl * 0.4;
        dirZ += nCenterZ * p.centerControl * 0.4;
    }

    // 2g. Edge riding — intentionally move toward edge
    if (p.edgeRiding > 0) {
        dirX -= nCenterX * p.edgeRiding * 0.4;
        dirZ -= nCenterZ * p.edgeRiding * 0.4;
    }

    // 2h. Edge aggression — position between opponent and edge
    if (p.edgeAggression > 0 && chaseDist > 0.1) {
        // Vector from opponent to nearest edge (outward from opponent)
        const opDist = Math.sqrt(percOpX * percOpX + percOpZ * percOpZ);
        if (opDist > 0.1) {
            const toEdgeX = percOpX / opDist;
            const toEdgeZ = percOpZ / opDist;
            // Target position: between opponent and edge
            const targetX = percOpX + toEdgeX * 2;
            const targetZ = percOpZ + toEdgeZ * 2;
            const tdx = targetX - selfX;
            const tdz = targetZ - selfZ;
            const tdLen = Math.sqrt(tdx * tdx + tdz * tdz);
            if (tdLen > 0.1) {
                dirX += (tdx / tdLen) * p.edgeAggression * 0.5;
                dirZ += (tdz / tdLen) * p.edgeAggression * 0.5;
            }
        }
    }

    // 2i. Herding — push opponent toward nearest edge
    if (p.herding > 0 && chaseDist > 0.1) {
        const opDist = Math.sqrt(percOpX * percOpX + percOpZ * percOpZ);
        if (opDist > 0.1) {
            // Position behind opponent (relative to center), pushing them outward
            const behindX = percOpX + (percOpX / opDist) * -2;
            const behindZ = percOpZ + (percOpZ / opDist) * -2;
            const hdx = behindX - selfX;
            const hdz = behindZ - selfZ;
            const hdLen = Math.sqrt(hdx * hdx + hdz * hdz);
            if (hdLen > 0.1) {
                dirX += (hdx / hdLen) * p.herding * aggression * 0.7;
                dirZ += (hdz / hdLen) * p.herding * aggression * 0.7;
            }
        }
    }

    // 2j. Territoriality — defend home zone
    if (p.territoriality > 0 && state) {
        const opHomeX = percOpX - state.homeX;
        const opHomeZ = percOpZ - state.homeZ;
        const opHomeDist = Math.sqrt(opHomeX * opHomeX + opHomeZ * opHomeZ);
        if (opHomeDist < 6) {
            // Opponent is in home zone — get more aggressive
            const territoryBoost =
                clamp01((6 - opHomeDist) / 6) * p.territoriality;
            dirX += nChaseX * territoryBoost * 0.5;
            dirZ += nChaseZ * territoryBoost * 0.5;
        } else {
            // Pull toward home zone
            const toHomeX = state.homeX - selfX;
            const toHomeZ = state.homeZ - selfZ;
            const toHomeDist = Math.sqrt(toHomeX * toHomeX + toHomeZ * toHomeZ);
            if (toHomeDist > 0.1) {
                dirX += (toHomeX / toHomeDist) * p.territoriality * 0.2;
                dirZ += (toHomeZ / toHomeDist) * p.territoriality * 0.2;
            }
        }
    }

    // 2k. Mirror tendency — match opponent's lateral movement
    if (p.mirrorTendency > 0 && state) {
        // Opponent's lateral velocity (perpendicular to chase axis)
        const opLatX =
            state.opVelX -
            nChaseX * (state.opVelX * nChaseX + state.opVelZ * nChaseZ);
        const opLatZ =
            state.opVelZ -
            nChaseZ * (state.opVelX * nChaseX + state.opVelZ * nChaseZ);
        const latSpeed = Math.sqrt(opLatX * opLatX + opLatZ * opLatZ);
        if (latSpeed > 0.5) {
            dirX += (opLatX / latSpeed) * p.mirrorTendency * 0.6;
            dirZ += (opLatZ / latSpeed) * p.mirrorTendency * 0.6;
        }
    }

    // 2l. Copycat — mirror opponent's movement intent (radial/tangential)
    // If opponent moves toward center, mimic does the same from its own position
    if (p.copycat > 0 && state) {
        const opSpeed = Math.sqrt(
            state.opVelX * state.opVelX + state.opVelZ * state.opVelZ,
        );
        if (opSpeed > 1) {
            const opDist = Math.sqrt(percOpX * percOpX + percOpZ * percOpZ);
            if (opDist > 0.1 && distFromCenter > 0.1) {
                // Opponent's radial direction (from center)
                const opRadX = percOpX / opDist;
                const opRadZ = percOpZ / opDist;
                // Radial speed: positive = away from center
                const opRadSpeed =
                    state.opVelX * opRadX + state.opVelZ * opRadZ;
                // Tangential component
                const opTanX = state.opVelX - opRadSpeed * opRadX;
                const opTanZ = state.opVelZ - opRadSpeed * opRadZ;
                // Apply same radial intent from mimic's own position
                dirX += nCenterX * -opRadSpeed * p.copycat * 0.04;
                dirZ += nCenterZ * -opRadSpeed * p.copycat * 0.04;
                // Apply tangential directly (orbit in same direction)
                const tanSpeed = Math.sqrt(opTanX * opTanX + opTanZ * opTanZ);
                if (tanSpeed > 0.1) {
                    dirX += (opTanX / tanSpeed) * p.copycat * 0.6;
                    dirZ += (opTanZ / tanSpeed) * p.copycat * 0.6;
                }
            }
        }
    }

    // 2m. Prediction — lead the target
    if (p.predictionStrength > 0 && state) {
        const leadTime = p.predictionStrength * 0.3;
        const predX = percOpX + state.opVelX * leadTime;
        const predZ = percOpZ + state.opVelZ * leadTime;
        const predChaseX = predX - selfX;
        const predChaseZ = predZ - selfZ;
        const predDist = Math.sqrt(
            predChaseX * predChaseX + predChaseZ * predChaseZ,
        );
        if (predDist > 0.1) {
            dirX +=
                (predChaseX / predDist - nChaseX) *
                p.predictionStrength *
                aggression *
                0.5;
            dirZ +=
                (predChaseZ / predDist - nChaseZ) *
                p.predictionStrength *
                aggression *
                0.5;
        }
    }

    // 2n. Random noise
    const angle = random * Math.PI * 2;
    dirX += Math.cos(angle) * erraticism;
    dirZ += Math.sin(angle) * erraticism;

    // 2o. Jitter — high-frequency micro-oscillations
    if (p.jitterAmplitude > 0 && state) {
        const jitterAngle = state.elapsed * 25; // high frequency
        dirX += Math.cos(jitterAngle) * p.jitterAmplitude * 0.5;
        dirZ += Math.sin(jitterAngle) * p.jitterAmplitude * 0.5;
    }

    // ---- Phase 3: Apply behavioral speed modifiers ----
    let speedScale = 1.0;

    // Patience — slow down when at preferred distance
    if (p.patience > 0 && p.preferredDistance > 0) {
        const distError = Math.abs(chaseDist - p.preferredDistance);
        if (distError < 2) {
            speedScale *= 1 - p.patience * 0.5 * (1 - distError / 2);
        }
    }

    // Burstiness — oscillate between stillness and speed
    if (p.burstiness > 0 && state) {
        const burstWave = Math.sin(state.burstPhase);
        const burstFactor = 1 - p.burstiness * 0.6 * clamp01(-burstWave);
        speedScale *= burstFactor;
    }

    // Feint — approach then retreat cycle
    if (p.feintRate > 0 && state) {
        const feintWave = Math.sin(state.feintPhase);
        if (
            feintWave < -0.5 &&
            chaseDist < (p.preferredDistance || p.approachDistance) + 2
        ) {
            // Retreat phase — briefly pull away
            dirX -= nChaseX * p.feintRate * 0.8;
            dirZ -= nChaseZ * p.feintRate * 0.8;
        }
    }

    // Ambush — go still, then burst when opponent comes close
    // Never ambush near edges — sitting still near the edge is suicidal
    if (p.ambushTendency > 0 && state) {
        if (state.ambushActive && edgeProximity > 0.55) {
            // Too close to edge — abort ambush
            state.ambushActive = false;
            state.ambushCooldown = 2;
        } else if (state.ambushActive) {
            if (chaseDist < p.approachDistance + 1) {
                // Opponent is close — break ambush, burst into action
                state.ambushActive = false;
                state.ambushCooldown = 4 + random * 3; // 4–7s cooldown
                speedScale *= 1.5; // burst speed
            } else {
                // Lying in wait
                speedScale *= 0.05; // nearly still
            }
        } else if (
            state.ambushCooldown <= 0 &&
            edgeProximity < 0.5 &&
            random < p.ambushTendency * dt * 0.3
        ) {
            state.ambushActive = true;
        }
    }

    // Commit window — sustained pressure
    if (p.commitWindow > 0 && state) {
        if (state.commitActive) {
            if (state.commitTimer > p.commitWindow) {
                state.commitActive = false;
                state.commitTimer = 0;
                // Cooldown: back off briefly
                speedScale *= 0.5;
            } else {
                // Committed — full speed, full aggression direction
                speedScale *= 1.1;
            }
        } else if (
            chaseDist < p.approachDistance + 2 &&
            state.commitTimer <= 0
        ) {
            // Start commit window when close enough
            if (random < 0.05) {
                state.commitActive = true;
                state.commitTimer = 0;
            }
        }
    }

    // Post-collision behaviors (state required)
    if (state) {
        // Retreat after hit
        if (p.retreatAfterHit > 0 && state.timeSinceCollision < 1.5) {
            const retreatFade = 1 - state.timeSinceCollision / 1.5;
            dirX -= nChaseX * p.retreatAfterHit * retreatFade * 0.8;
            dirZ -= nChaseZ * p.retreatAfterHit * retreatFade * 0.8;
        }

        // Bounce chasing — chase harder after landing a hit
        if (p.bounceChasing > 0 && state.timeSinceCollision < 2) {
            const chaseFade = 1 - state.timeSinceCollision / 2;
            dirX += nChaseX * p.bounceChasing * chaseFade * 0.5;
            dirZ += nChaseZ * p.bounceChasing * chaseFade * 0.5;
        }

        // Post-hit pause
        if (p.postHitPause > 0 && state.timeSinceCollision < 0.1) {
            state.postHitTimer = p.postHitPause;
        }
        if (state.postHitTimer > 0) {
            speedScale *= 0.05; // nearly still
        }
    }

    // Showboating movement — dramatic tricks when ahead
    if (p.showboating > 0 && state) {
        const lead = state.selfScore - state.opponentScore;
        if (lead > 0 && edgeProximity < 0.55) {
            const showIntensity = clamp01(lead * p.showboating * 0.5);
            // Cycle through tricks: tight donuts, side-to-side taunts, lurches
            const trickPhase = (state.elapsed * 1.5) % 3;
            if (trickPhase < 1) {
                // Tight donut — fast circular movement
                const donutAngle = state.elapsed * 8;
                dirX += Math.cos(donutAngle) * showIntensity * 0.7;
                dirZ += Math.sin(donutAngle) * showIntensity * 0.7;
            } else if (trickPhase < 2) {
                // Side-to-side taunt — rapid lateral oscillation
                const tauntWave = Math.sin(state.elapsed * 12);
                const perpX = -nChaseZ;
                const perpZ = nChaseX;
                dirX += perpX * tauntWave * showIntensity * 0.6;
                dirZ += perpZ * tauntWave * showIntensity * 0.6;
            } else {
                // Lurch — charge forward then pull back (fake-out)
                const lurchWave = Math.sin(state.elapsed * 6);
                dirX += nChaseX * lurchWave * showIntensity * 0.5;
                dirZ += nChaseZ * lurchWave * showIntensity * 0.5;
            }
        }
    }

    // ---- Phase 4: Normalize, apply momentum, scale by speed ----

    let outDirX = dirX;
    let outDirZ = dirZ;
    const dirLen = Math.sqrt(outDirX * outDirX + outDirZ * outDirZ);
    if (dirLen > 0.01) {
        outDirX /= dirLen;
        outDirZ /= dirLen;
    } else {
        outDirX = 0;
        outDirZ = 0;
    }

    // Momentum commitment — blend with previous direction
    if (p.momentumCommitment > 0 && state) {
        const blend = p.momentumCommitment * 0.9; // 0–0.9 blending factor
        outDirX = outDirX * (1 - blend) + state.prevDirX * blend;
        outDirZ = outDirZ * (1 - blend) + state.prevDirZ * blend;
        // Re-normalize
        const mLen = Math.sqrt(outDirX * outDirX + outDirZ * outDirZ);
        if (mLen > 0.01) {
            outDirX /= mLen;
            outDirZ /= mLen;
        }
    }

    // Store direction for next frame
    if (state) {
        state.prevDirX = outDirX;
        state.prevDirZ = outDirZ;
    }

    // Apply speed
    outDirX *= moveSpeedEff * speedScale;
    outDirZ *= moveSpeedEff * speedScale;

    // Convert world XZ to input axes
    let moveX = clamp(outDirX, -1, 1);
    let moveY = clamp(-outDirZ, -1, 1);

    // ---- Phase 5: Dash decision ----
    const inRange = chaseDist <= p.approachDistance;
    const nearEdge = edgeProximity > 0.65;
    const dashProb = dashRateEff * dt;
    let dash = inRange && !nearEdge && random < dashProb;

    // Sacrificial dash — override edge safety
    if (p.sacrificialDash > 0 && inRange && nearEdge && !dash) {
        const opEdge =
            Math.sqrt(percOpX * percOpX + percOpZ * percOpZ) / arenaRadius;
        if (opEdge > 0.5 && random < p.sacrificialDash * dashProb) {
            dash = true;
        }
    }

    // Dodge reflex — perpendicular escape dash
    if (p.dodgeReflex > 0 && state && !dash) {
        const opApproach = dotToward(
            selfX,
            selfZ,
            percOpX,
            percOpZ,
            state.opVelX,
            state.opVelZ,
        );
        if (opApproach > 5 && random < p.dodgeReflex * dt * 4) {
            // Dash perpendicular to incoming
            const perpX = -nChaseZ;
            const perpZ = nChaseX;
            moveX = clamp(perpX, -1, 1);
            moveY = clamp(-perpZ, -1, 1);
            dash = true;
        }
    }

    // Counter dash — dash when opponent dashes toward us
    if (p.counterDashRate > 0 && state && !dash) {
        if (
            state.timeSinceOpDash < 0.15 &&
            chaseDist < p.approachDistance + 3
        ) {
            if (random < p.counterDashRate * 0.5) {
                dash = true;
            }
        }
    }

    // Respect momentum — punish opponent's whiffed dashes
    if (p.respectMomentum > 0 && state && !dash) {
        if (
            state.timeSinceOpDash > 0.2 &&
            state.timeSinceOpDash < 0.8 &&
            chaseDist < p.approachDistance + 2
        ) {
            if (random < p.respectMomentum * dt * 3) {
                dash = true;
            }
        }
    }

    // Dash direction bias — override movement on dash frame
    if (dash && p.dashDirection < 1) {
        if (p.dashDirection <= 0) {
            // Perpendicular (0) or away (-1)
            const perpX = -nChaseZ;
            const perpZ = nChaseX;
            const blendPerp = 1 - Math.abs(p.dashDirection); // 1 at 0, 0 at ±1
            const blendAway = p.dashDirection < 0 ? -p.dashDirection : 0;
            const ddx =
                perpX * blendPerp +
                -nChaseX * blendAway +
                nChaseX * (1 - blendPerp - blendAway);
            const ddz =
                perpZ * blendPerp +
                -nChaseZ * blendAway +
                nChaseZ * (1 - blendPerp - blendAway);
            moveX = clamp(ddx, -1, 1);
            moveY = clamp(-ddz, -1, 1);
        } else {
            // Between toward (1) and perpendicular (0)
            const perpX = -nChaseZ;
            const perpZ = nChaseX;
            const blendPerp = 1 - p.dashDirection;
            const ddx = nChaseX * p.dashDirection + perpX * blendPerp;
            const ddz = nChaseZ * p.dashDirection + perpZ * blendPerp;
            moveX = clamp(ddx, -1, 1);
            moveY = clamp(-ddz, -1, 1);
        }
    }

    return { moveX, moveY, dash };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Compute how fast a body is approaching a target (dot product projection).
 * Returns >= 0 (retreating gives 0).
 */
function dotToward(
    targetX: number,
    targetZ: number,
    sourceX: number,
    sourceZ: number,
    velX: number,
    velZ: number,
): number {
    const dx = targetX - sourceX;
    const dz = targetZ - sourceZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return Math.sqrt(velX * velX + velZ * velZ);
    const dot = (velX * dx + velZ * dz) / len;
    return Math.max(0, dot);
}
