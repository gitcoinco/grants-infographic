/** GrantRoundImplementation contract ABI in Human Readable ABI Format  */

const roundImplementation = [
  "event ApplicationMetaPtrUpdated(tuple(uint256 protocol, string pointer) oldMetaPtr, tuple(uint256 protocol, string pointer) newMetaPtr)",
  "event ApplicationStatusesUpdated(uint256 indexed index, uint256 indexed status)",
  "event ApplicationsEndTimeUpdated(uint256 oldTime, uint256 newTime)",
  "event ApplicationsStartTimeUpdated(uint256 oldTime, uint256 newTime)",
  "event Initialized(uint8 version)",
  "event MatchAmountUpdated(uint256 newAmount)",
  "event NewProjectApplication(bytes32 indexed projectID, uint256 applicationIndex, tuple(uint256 protocol, string pointer) applicationMetaPtr)",
  "event PayFeeAndEscrowFundsToPayoutContract(uint256 matchAmountAfterFees, uint256 protocolFeeAmount, uint256 roundFeeAmount)",
  "event ProjectsMetaPtrUpdated(tuple(uint256 protocol, string pointer) oldMetaPtr, tuple(uint256 protocol, string pointer) newMetaPtr)",
  "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoundEndTimeUpdated(uint256 oldTime, uint256 newTime)",
  "event RoundFeeAddressUpdated(address roundFeeAddress)",
  "event RoundFeePercentageUpdated(uint32 roundFeePercentage)",
  "event RoundMetaPtrUpdated(tuple(uint256 protocol, string pointer) oldMetaPtr, tuple(uint256 protocol, string pointer) newMetaPtr)",
  "event RoundStartTimeUpdated(uint256 oldTime, uint256 newTime)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function ROUND_OPERATOR_ROLE() view returns (bytes32)",
  "function VERSION() view returns (string)",
  "function alloSettings() view returns (address)",
  "function applicationMetaPtr() view returns (uint256 protocol, string pointer)",
  "function applicationStatusesBitMap(uint256) view returns (uint256)",
  "function applications(uint256) view returns (bytes32 projectID, uint256 applicationIndex, tuple(uint256 protocol, string pointer) metaPtr)",
  "function applicationsEndTime() view returns (uint256)",
  "function applicationsIndexesByProjectID(bytes32, uint256) view returns (uint256)",
  "function applicationsStartTime() view returns (uint256)",
  "function applyToRound(bytes32 projectID, tuple(uint256 protocol, string pointer) newApplicationMetaPtr)",
  "function getApplicationIndexesByProjectID(bytes32 projectID) view returns (uint256[])",
  "function getApplicationStatus(uint256 applicationIndex) view returns (uint256)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function getRoleMember(bytes32 role, uint256 index) view returns (address)",
  "function getRoleMemberCount(bytes32 role) view returns (uint256)",
  "function grantRole(bytes32 role, address account)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function initialize(bytes encodedParameters, address _alloSettings)",
  "function matchAmount() view returns (uint256)",
  "function nextApplicationIndex() view returns (uint256)",
  "function payoutStrategy() view returns (address)",
  "function renounceRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function roundEndTime() view returns (uint256)",
  "function roundFeeAddress() view returns (address)",
  "function roundFeePercentage() view returns (uint32)",
  "function roundMetaPtr() view returns (uint256 protocol, string pointer)",
  "function roundStartTime() view returns (uint256)",
  "function setApplicationStatuses(tuple(uint256 index, uint256 statusRow)[] statuses)",
  "function setReadyForPayout() payable",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function token() view returns (address)",
  "function updateApplicationMetaPtr(tuple(uint256 protocol, string pointer) newApplicationMetaPtr)",
  "function updateMatchAmount(uint256 newAmount)",
  "function updateRoundFeeAddress(address newFeeAddress)",
  "function updateRoundFeePercentage(uint32 newFeePercentage)",
  "function updateRoundMetaPtr(tuple(uint256 protocol, string pointer) newRoundMetaPtr)",
  "function updateStartAndEndTimes(uint256 newApplicationsStartTime, uint256 newApplicationsEndTime, uint256 newRoundStartTime, uint256 newRoundEndTime)",
  "function vote(bytes[] encodedVotes) payable",
  "function votingStrategy() view returns (address)",
  "function withdraw(address tokenAddress, address recipent)",
];

export default roundImplementation;
