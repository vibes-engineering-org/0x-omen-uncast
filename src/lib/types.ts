import type { Address } from "viem";

export type NFTProvider = "manifold" | "opensea" | "zora" | "generic" | "nfts2me" | "thirdweb";

export interface ProviderConfig {
  name: NFTProvider;
  detectPattern?: RegExp;
  extensionAddresses?: Address[];
  priceDiscovery: PriceDiscoveryConfig;
  mintConfig: MintConfig;
  requiredParams: string[];
  supportsERC20: boolean;
}

export interface PriceDiscoveryConfig {
  abis: any[];
  functionNames: string[];
  requiresInstanceId?: boolean;
  requiresAmountParam?: boolean;
}

export interface MintConfig {
  abi: any;
  functionName: string;
  buildArgs: (params: MintParams) => any[];
  calculateValue: (price: bigint, params: MintParams) => bigint;
}

export interface MintParams {
  contractAddress: Address;
  chainId: number;
  provider?: NFTProvider;
  amount?: number;
  instanceId?: string;
  tokenId?: string;
  recipient?: Address;
  merkleProof?: string[];
}

export interface NFTContractInfo {
  provider: NFTProvider;
  isERC1155: boolean;
  isERC721: boolean;
  extensionAddress?: Address;
  hasManifoldExtension?: boolean;
  mintPrice?: bigint;
  erc20Token?: Address;
  erc20Symbol?: string;
  erc20Decimals?: number;
  claim?: {
    cost: bigint;
    merkleRoot: `0x${string}`;
    erc20: Address;
    startDate: number;
    endDate: number;
    walletMax: number;
  };
  claimCondition?: {
    id: number;
    pricePerToken: bigint;
    currency: Address;
    maxClaimableSupply: bigint;
    merkleRoot: `0x${string}`;
    startTimestamp: number;
    quantityLimitPerWallet: bigint;
  };
}

export interface ValidationResult {
  isValid: boolean;
  missingParams: string[];
  errors: string[];
  warnings: string[];
}

export interface CastAuthor {
  fid: number;
  username: string;
  display_name?: string;
  pfp_url?: string;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

export interface CastEmbed {
  url?: string;
  cast?: {
    hash: string;
    author: CastAuthor;
  };
  metadata?: {
    content_type?: string;
    _status?: string;
    image?: {
      url: string;
      width_px: number;
      height_px: number;
    };
  };
}

export interface Cast {
  hash: string;
  parent_hash?: string;
  parent_url?: string;
  root_parent_url?: string;
  parent_author?: CastAuthor;
  author: CastAuthor;
  text: string;
  timestamp: string;
  embeds: CastEmbed[];
  replies: {
    count: number;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: Array<{
      fid: number;
      fname: string;
    }>;
    recasts: Array<{
      fid: number;
      fname: string;
    }>;
  };
  channel?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface ThreadSegment {
  id: string;
  author: CastAuthor;
  text: string;
  timestamp: string;
  embeds: CastEmbed[];
  casts: Cast[];
  totalCharacters: number;
  imageCount: number;
}

export interface UnrolledThread {
  url: string;
  rootCast: Cast;
  segments: ThreadSegment[];
  totalCasts: number;
  totalCharacters: number;
  totalImages: number;
  hasMore: boolean;
}

export interface ThreadBookmark {
  id: string;
  url: string;
  title: string;
  segmentIndex: number;
  characterOffset: number;
  timestamp: string;
  lastRead: string;
}

export interface LikedCast {
  hash: string;
  timestamp: string;
  author: string;
  text: string;
}

export interface UncastState {
  currentThread?: UnrolledThread;
  loading: boolean;
  error?: string;
  likedCasts: Set<string>;
  bookmarks: ThreadBookmark[];
  currentBookmark?: ThreadBookmark;
}