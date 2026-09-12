import type { ComponentProps } from "react";
import {
  ArrowRight,
  Brain,
  CalendarBlank,
  Cards,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  ChatCircle,
  Check,
  Clock,
  Coin,
  Crown,
  DownloadSimple,
  Exam,
  Eye,
  EyeSlash,
  FileText,
  Fire,
  GearSix,
  GlobeSimple,
  House,
  Image as ImageGlyph,
  Info,
  Key,
  Lightning,
  List,
  LockSimple,
  MagnifyingGlass,
  Medal,
  Moon,
  PencilSimple,
  Play,
  Plus,
  Sun,
  ShieldChevron,
  Shuffle,
  SignOut,
  Sparkle,
  Sword,
  Target,
  Trash,
  Trophy,
  UploadSimple,
  UserFocus,
  UserMinus,
  UserPlus,
  UsersThree,
  X,
} from "@phosphor-icons/react/dist/ssr";

/**
 * The icon set.
 *
 * Every glyph is Phosphor, imported through the SSR entry point so these stay
 * usable from server components. The names and the `{ size, className }` shape
 * are unchanged from the hand-drawn set they replace, so nothing at any call
 * site had to move.
 *
 * Two weights, and the split between them is a rule rather than a preference:
 *
 *   bold  — anything you navigate with or act on. Nav, toolbars, buttons.
 *   fill  — anything that represents a thing you have or have earned. Coins,
 *           streak, crown, trophy, the padlock on the Arena.
 *
 * Solid glyphs read as objects and outlined glyphs read as actions, which is
 * the distinction that matters in a product where you collect things.
 */

type Glyph = typeof House;
type IconProps = Omit<ComponentProps<Glyph>, "weight"> & { size?: number };

function action(Base: Glyph) {
  const Wrapped = ({ size = 20, ...props }: IconProps) => (
    <Base size={size} weight="bold" aria-hidden="true" {...props} />
  );
  Wrapped.displayName = `Action(${Base.displayName ?? "Icon"})`;
  return Wrapped;
}

function object_(Base: Glyph) {
  const Wrapped = ({ size = 20, ...props }: IconProps) => (
    <Base size={size} weight="fill" aria-hidden="true" {...props} />
  );
  Wrapped.displayName = `Object(${Base.displayName ?? "Icon"})`;
  return Wrapped;
}

/* -------------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------------- */

export const HomeIcon = action(House);
export const CardsIcon = action(Cards);
export const QuizIcon = action(Exam);
export const FeedbackIcon = action(ChartLineUp);
export const CommunityIcon = action(UsersThree);
export const CalendarIcon = action(CalendarBlank);
export const SettingsIcon = action(GearSix);
export const MenuIcon = action(List);

/* -------------------------------------------------------------------------
   Things you earn or hold — solid, so they read as objects
   ------------------------------------------------------------------------- */

export const CoinIcon = object_(Coin);
export const FlameIcon = object_(Fire);
export const CrownIcon = object_(Crown);
export const TrophyIcon = object_(Trophy);
export const RankIcon = object_(Medal);
export const LockIcon = object_(LockSimple);

/* -------------------------------------------------------------------------
   The Arena — not built yet, but the icons are real
   ------------------------------------------------------------------------- */

export const SwordIcon = action(Sword);
export const ShieldIcon = action(ShieldChevron);
export const CharacterIcon = action(UserFocus);

/* -------------------------------------------------------------------------
   Actions and controls
   ------------------------------------------------------------------------- */

export const PlusIcon = action(Plus);
export const SearchIcon = action(MagnifyingGlass);
export const UploadIcon = action(UploadSimple);
export const DownloadIcon = action(DownloadSimple);
export const CheckIcon = action(Check);
export const XIcon = action(X);
export const ChevronRightIcon = action(CaretRight);
export const ChevronLeftIcon = action(CaretLeft);
export const ArrowRightIcon = action(ArrowRight);
export const PlayIcon = action(Play);
export const TrashIcon = action(Trash);
export const EditIcon = action(PencilSimple);
export const ShuffleIcon = action(Shuffle);
export const LogOutIcon = action(SignOut);
export const UserPlusIcon = action(UserPlus);
export const UserMinusIcon = action(UserMinus);
export const KeyIcon = action(Key);
export const EyeIcon = action(Eye);
export const EyeOffIcon = action(EyeSlash);
export const ImageIcon = action(ImageGlyph);

/* -------------------------------------------------------------------------
   Concepts
   ------------------------------------------------------------------------- */

export const GlobeIcon = action(GlobeSimple);
export const BrainIcon = action(Brain);
export const ZapIcon = action(Lightning);
export const TargetIcon = action(Target);
export const SparkIcon = action(Sparkle);
export const FileTextIcon = action(FileText);
export const MessageIcon = action(ChatCircle);
export const InfoIcon = action(Info);
export const ClockIcon = action(Clock);
export const SunIcon = action(Sun);
export const MoonIcon = action(Moon);
