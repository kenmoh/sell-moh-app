import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const IN_MS = 300;
const OUT_MS = 140;
const DRAW_MS = 420;

const palettes = {
  light: {
    bg: "#FBF9F4",
    halo: "#E8F2EE",
    line: "#C7CFCB",
    border: "#DCE4E0",
    card: "#FFFFFF",
    green: "#0F6B5C",
    greenDeep: "#0B4F44",
    orange: "#FF7A45",
    ink: "#1B211F",
  },
  dark: {
    bg: "#14181A",
    halo: "#1C2926",
    line: "#3B4340",
    border: "#303A36",
    card: "#1F2724",
    green: "#3ED6AE",
    greenDeep: "#1F8A6E",
    orange: "#FF9466",
    ink: "#EDEFEE",
  },
} as const;

type Palette = Record<keyof (typeof palettes)["light"], string>;

function useIlloPalette(): Palette {
  const scheme = useColorScheme();
  return palettes[scheme === "dark" ? "dark" : "light"];
}

type EnterGProps = {
  active: boolean;
  delay?: number;
  dy?: number;
  scaleFrom?: number;
  scaleYFrom?: number;
  origin?: [number, number];
  children: React.ReactNode;
};

function useEnterProgress(active: boolean, delay: number) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (active) {
      p.value = withDelay(
        delay,
        withTiming(1, {
          duration: reduced ? 200 : IN_MS,
          easing: EASE_OUT,
        }),
      );
    } else {
      p.value = withTiming(0, { duration: OUT_MS, easing: EASE_OUT });
    }
  }, [active, delay, reduced, p]);

  return { p, reduced };
}

function EnterG({
  active,
  delay = 0,
  dy = 6,
  scaleFrom,
  scaleYFrom,
  origin,
  children,
}: EnterGProps) {
  const { p, reduced } = useEnterProgress(active, delay);

  const animatedProps = useAnimatedProps(() => {
    const t = reduced ? 0 : dy * (1 - p.value);
    let transform = `translate(0 ${t})`;
    if (!reduced && origin && scaleFrom !== undefined) {
      const s = scaleFrom + (1 - scaleFrom) * p.value;
      transform += ` translate(${origin[0]} ${origin[1]}) scale(${s}) translate(${-origin[0]} ${-origin[1]})`;
    }
    if (!reduced && origin && scaleYFrom !== undefined) {
      const s = scaleYFrom + (1 - scaleYFrom) * p.value;
      transform += ` translate(${origin[0]} ${origin[1]}) scale(1 ${s}) translate(${-origin[0]} ${-origin[1]})`;
    }
    return { transform, opacity: p.value };
  });

  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
}

type DrawPathProps = {
  active: boolean;
  delay?: number;
  length: number;
  d: string;
  stroke: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  opacity?: number;
};

function DrawPath({
  active,
  delay = 0,
  length,
  ...rest
}: DrawPathProps) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      p.value = 1;
      return;
    }
    if (active) {
      p.value = withDelay(
        delay,
        withTiming(1, { duration: DRAW_MS, easing: EASE_OUT }),
      );
    } else {
      p.value = withTiming(0, { duration: OUT_MS, easing: EASE_OUT });
    }
  }, [active, delay, reduced, p]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: reduced ? 0 : length * (1 - p.value),
  }));

  return (
    <AnimatedPath
      {...rest}
      fill="none"
      strokeDasharray={reduced ? undefined : length}
      animatedProps={animatedProps}
    />
  );
}

function Halo({ active, c }: { active: boolean; c: Palette }) {
  return (
    <EnterG active={active} dy={0} scaleFrom={0.96} origin={[200, 220]}>
      <Circle cx={200} cy={220} r={128} fill={c.halo} />
    </EnterG>
  );
}

export type IllustrationProps = { active: boolean; size: number };

export function WelcomeIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <EnterG active={active} delay={120}>
        <Rect x={79} y={250} width={70} height={80} rx={10} fill={c.card} />
        <Path d="M73,250 L114,224 L155,250 Z" fill={c.greenDeep} />
        <Rect
          x={101.4}
          y={286}
          width={25.2}
          height={44}
          rx={4}
          fill={c.bg}
        />
      </EnterG>

      <EnterG active={active} delay={180} dy={8}>
        <Rect x={163} y={224} width={90} height={106} rx={10} fill={c.green} />
        <Path d="M157,224 L208,198 L259,224 Z" fill={c.greenDeep} />
        <Rect
          x={191.8}
          y={271.7}
          width={32.4}
          height={58.3}
          rx={4}
          fill={c.bg}
        />
      </EnterG>

      <EnterG active={active} delay={240}>
        <Rect x={259} y={258} width={62} height={72} rx={10} fill={c.card} />
        <Path d="M253,258 L290,232 L327,258 Z" fill={c.greenDeep} />
        <Rect
          x={278.84}
          y={290.4}
          width={22.32}
          height={39.6}
          rx={4}
          fill={c.bg}
        />
      </EnterG>

      <EnterG
        active={active}
        delay={380}
        dy={4}
        scaleFrom={0.9}
        origin={[208, 150]}
      >
        <Circle cx={208} cy={150} r={22} fill={c.orange} />
        <DrawPath
          active={active}
          delay={500}
          length={40}
          d="M198,150 L205,158 L220,141"
          stroke={c.bg}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </EnterG>
    </Svg>
  );
}

export function CheckoutIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <EnterG active={active} delay={100} dy={8}>
        <Rect
          x={140}
          y={150}
          width={120}
          height={150}
          rx={16}
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
      </EnterG>

      <EnterG active={active} delay={170} dy={4}>
        <Rect x={156} y={168} width={88} height={60} rx={6} fill={c.green} />
      </EnterG>

      <EnterG active={active} delay={230} dy={3}>
        <Rect x={156} y={240} width={24} height={10} rx={3} fill={c.line} />
        <Rect x={188} y={240} width={24} height={10} rx={3} fill={c.line} />
        <Rect x={220} y={240} width={24} height={10} rx={3} fill={c.line} />
        <Rect x={156} y={258} width={24} height={10} rx={3} fill={c.line} />
        <Rect x={188} y={258} width={24} height={10} rx={3} fill={c.line} />
      </EnterG>

      <EnterG active={active} delay={290} dy={3}>
        <Rect x={220} y={258} width={24} height={10} rx={3} fill={c.orange} />
      </EnterG>

      <EnterG active={active} delay={330} dy={10}>
        <G transform="translate(255,110) rotate(18)">
          <Rect x={0} y={0} width={70} height={46} rx={8} fill={c.orange} />
          <Rect x={10} y={12} width={20} height={14} rx={3} fill={c.bg} />
        </G>
      </EnterG>

      <DrawPath
        active={active}
        delay={430}
        length={45}
        d="M258,96 q10,-14 22,-8"
        stroke={c.ink}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />
      <DrawPath
        active={active}
        delay={490}
        length={50}
        d="M266,88 q10,-16 24,-10"
        stroke={c.ink}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.3}
      />

      <EnterG active={active} delay={460} dy={8}>
        <Path
          d="M150,300 q35,26 110,0 l-6,34 q-49,20 -98,0 Z"
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
        <Line
          x1={164}
          y1={316}
          x2={236}
          y2={316}
          stroke={c.line}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Line
          x1={164}
          y1={326}
          x2={216}
          y2={326}
          stroke={c.line}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </EnterG>
    </Svg>
  );
}

export function SyncIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <EnterG active={active} delay={120}>
        <Rect x={128} y={262} width={64} height={52} rx={8} fill={c.card} />
        <Line
          x1={128}
          y1={280}
          x2={192}
          y2={280}
          stroke={c.bg}
          strokeWidth={3}
        />
        <Line
          x1={160}
          y1={262}
          x2={160}
          y2={280}
          stroke={c.bg}
          strokeWidth={3}
        />
      </EnterG>

      <EnterG active={active} delay={180}>
        <Rect x={206} y={262} width={64} height={52} rx={8} fill={c.green} />
        <Line
          x1={206}
          y1={280}
          x2={270}
          y2={280}
          stroke={c.bg}
          strokeWidth={3}
        />
        <Line
          x1={238}
          y1={262}
          x2={238}
          y2={280}
          stroke={c.bg}
          strokeWidth={3}
        />
      </EnterG>

      <EnterG active={active} delay={240} dy={8}>
        <Rect x={167} y={210} width={64} height={52} rx={8} fill={c.orange} />
        <Line
          x1={167}
          y1={228}
          x2={231}
          y2={228}
          stroke={c.bg}
          strokeWidth={3}
        />
        <Line
          x1={199}
          y1={210}
          x2={199}
          y2={228}
          stroke={c.bg}
          strokeWidth={3}
        />
      </EnterG>

      <G transform="translate(200,120)">
        <DrawPath
          active={active}
          delay={340}
          length={180}
          d="M-30,0 a30,30 0 1 1 8,20"
          stroke={c.green}
          strokeWidth={7}
          strokeLinecap="round"
        />
        <DrawPath
          active={active}
          delay={520}
          length={40}
          d="M-24,10 L-30,20 L-38,8"
          stroke={c.green}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      <EnterG
        active={active}
        delay={420}
        dy={0}
        scaleFrom={0.85}
        origin={[270, 200]}
      >
        <Circle cx={270} cy={200} r={9} fill={c.orange} />
      </EnterG>

      <EnterG active={active} delay={490} dy={0}>
        <Circle cx={140} cy={330} r={6} fill={c.line} />
      </EnterG>
    </Svg>
  );
}

export function PaymentsIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <EnterG active={active} delay={110} dy={10}>
        <G transform="translate(120,150) rotate(-8)">
          <Rect x={0} y={0} width={150} height={94} rx={14} fill={c.green} />
          <Rect
            x={18}
            y={20}
            width={34}
            height={24}
            rx={5}
            fill={c.bg}
            opacity={0.85}
          />
          <Line
            x1={18}
            y1={70}
            x2={86}
            y2={70}
            stroke={c.bg}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.6}
          />
        </G>
      </EnterG>

      <EnterG
        active={active}
        delay={250}
        dy={4}
        scaleFrom={0.9}
        origin={[272, 150]}
      >
        <Circle cx={272} cy={150} r={34} fill={c.orange} />
        <SvgText
          x={272}
          y={161}
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize={30}
          fontWeight="700"
          textAnchor="middle"
          fill={c.bg}
        >
          N
        </SvgText>
      </EnterG>

      <EnterG active={active} delay={320} dy={4}>
        <Circle
          cx={150}
          cy={292}
          r={24}
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
      </EnterG>

      <EnterG active={active} delay={370} dy={4}>
        <Circle
          cx={182}
          cy={292}
          r={24}
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
      </EnterG>

      <EnterG
        active={active}
        delay={420}
        dy={4}
        scaleFrom={0.9}
        origin={[214, 292]}
      >
        <Circle cx={214} cy={292} r={24} fill={c.greenDeep} />
        <DrawPath
          active={active}
          delay={540}
          length={40}
          d="M204,292 l7,7 14,-15"
          stroke={c.bg}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </EnterG>
    </Svg>
  );
}

export function TeamIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <EnterG active={active} delay={120} dy={6}>
        <Circle
          cx={140}
          cy={228}
          r={20}
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
        <Path
          d="M110,296 q0,-40 30,-40 q30,0 30,40 Z"
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
        <Rect x={116} y={302} width={48} height={16} rx={8} fill={c.border} />
      </EnterG>

      <EnterG
        active={active}
        delay={260}
        dy={8}
        scaleFrom={0.96}
        origin={[200, 240]}
      >
        <Circle cx={200} cy={202} r={20} fill={c.green} />
        <Path
          d="M170,270 q0,-40 30,-40 q30,0 30,40 Z"
          fill={c.green}
        />
        <Rect x={170} y={276} width={60} height={16} rx={8} fill={c.orange} />
      </EnterG>

      <EnterG active={active} delay={180} dy={6}>
        <Circle
          cx={262}
          cy={228}
          r={20}
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
        <Path
          d="M232,296 q0,-40 30,-40 q30,0 30,40 Z"
          fill={c.card}
          stroke={c.border}
          strokeWidth={2}
        />
        <Rect x={238} y={302} width={48} height={16} rx={8} fill={c.border} />
      </EnterG>

      <EnterG
        active={active}
        delay={400}
        dy={0}
        scaleFrom={0.85}
        origin={[200, 180]}
      >
        <Circle cx={200} cy={180} r={10} fill={c.orange} />
      </EnterG>
    </Svg>
  );
}

export function AnalyticsIllo({ active, size }: IllustrationProps) {
  const c = useIlloPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Halo active={active} c={c} />

      <DrawPath
        active={active}
        delay={80}
        length={160}
        d="M130,300 L286,300"
        stroke={c.line}
        strokeWidth={3}
        strokeLinecap="round"
      />

      <EnterG active={active} delay={170} dy={0} scaleYFrom={0.12} origin={[153, 300]}>
        <Rect x={140} y={240} width={26} height={60} rx={6} fill={c.border} />
      </EnterG>

      <EnterG active={active} delay={230} dy={0} scaleYFrom={0.12} origin={[189, 300]}>
        <Rect x={176} y={200} width={26} height={100} rx={6} fill={c.green} />
      </EnterG>

      <EnterG active={active} delay={290} dy={0} scaleYFrom={0.12} origin={[225, 300]}>
        <Rect x={212} y={224} width={26} height={76} rx={6} fill={c.border} />
      </EnterG>

      <EnterG active={active} delay={350} dy={0} scaleYFrom={0.12} origin={[261, 300]}>
        <Rect x={248} y={170} width={26} height={130} rx={6} fill={c.green} />
      </EnterG>

      <DrawPath
        active={active}
        delay={470}
        length={175}
        d="M140,190 L176,150 L212,168 L252,110"
        stroke={c.orange}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <EnterG
        active={active}
        delay={700}
        dy={0}
        scaleFrom={0.85}
        origin={[252, 110]}
      >
        <Circle cx={252} cy={110} r={9} fill={c.orange} />
        <DrawPath
          active={active}
          delay={780}
          length={45}
          d="M240,102 L254,96 L260,110"
          stroke={c.orange}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </EnterG>
    </Svg>
  );
}
