import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface XPRingProps {
  level: number;
  xpPercent: number; // 0–100
  size?: number;
  strokeWidth?: number;
}

export default function XPRing({ level, xpPercent, size = 150, strokeWidth = 9 }: XPRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (xpPercent / 100);
  const offset = circumference - filled;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4A0EC0" />
            <Stop offset="100%" stopColor="#C47FFF" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      {/* Center text */}
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.levelNum}>{level}</Text>
        <Text style={styles.levelLabel}>NIVEL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 36,
    textShadowColor: 'rgba(180,127,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  levelLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },
});
