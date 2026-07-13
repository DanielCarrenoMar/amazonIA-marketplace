// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovernanceRegistry {
    enum Role { NONE, MEMBER, ELDER }

    struct Proposal {
        string proposalId;
        string contentHash;
        string proposerUserId;
        uint256 deadline;
        uint256 votesFor;
        uint256 votesAgainst;
        bool vetoed;
        string vetoReason;
        bool finalized;
        bool exists;
    }

    address public elder;
    
    // Mapping of address to Role
    mapping(address => Role) public roles;
    // Mapping of address to User ID (for query/audit purposes)
    mapping(address => string) public userIds;
    // Mapping of proposalId to Proposal
    mapping(string => Proposal) public proposals;
    // Mapping of proposalId to voter address to whether they voted
    mapping(string => mapping(address => bool)) public hasVoted;

    event RoleAssigned(address indexed member, string userId, Role role);
    event EldershipTransferred(address indexed previousElder, address indexed newElder);
    event ProposalCreated(string proposalId, string contentHash, string proposerUserId, uint256 deadline);
    event VoteCast(string proposalId, address indexed voter, bool inFavor, uint256 weight);
    event ProposalVetoed(string proposalId, string reason);
    event ProposalFinalized(string proposalId, bool approved);

    modifier onlyElder() {
        require(msg.sender == elder, "GovernanceRegistry: caller is not the Elder");
        _;
    }

    modifier onlyMemberOrElder() {
        require(roles[msg.sender] == Role.MEMBER || roles[msg.sender] == Role.ELDER, "GovernanceRegistry: caller is not a member or Elder");
        _;
    }

    constructor() {
        elder = msg.sender;
        roles[msg.sender] = Role.ELDER;
        userIds[msg.sender] = "SYSTEM_ELDER";
        emit RoleAssigned(msg.sender, "SYSTEM_ELDER", Role.ELDER);
    }

    function assignRole(address _member, string calldata _userId, Role _role) external onlyElder {
        require(_member != address(0), "GovernanceRegistry: invalid address");
        roles[_member] = _role;
        userIds[_member] = _userId;
        emit RoleAssigned(_member, _userId, _role);
    }

    function transferEldership(address _newElder) external onlyElder {
        require(_newElder != address(0), "GovernanceRegistry: invalid address");
        roles[elder] = Role.MEMBER; // Demote previous elder to member
        emit RoleAssigned(elder, userIds[elder], Role.MEMBER);

        elder = _newElder;
        roles[_newElder] = Role.ELDER;
        emit EldershipTransferred(msg.sender, _newElder);
        emit RoleAssigned(_newElder, userIds[_newElder], Role.ELDER);
    }

    function createProposal(
        string calldata _proposalId,
        string calldata _contentHash,
        string calldata _proposerUserId,
        uint256 _deadline
    ) external onlyMemberOrElder {
        require(!proposals[_proposalId].exists, "GovernanceRegistry: proposal already exists");
        require(_deadline > block.timestamp, "GovernanceRegistry: deadline must be in the future");

        proposals[_proposalId] = Proposal({
            proposalId: _proposalId,
            contentHash: _contentHash,
            proposerUserId: _proposerUserId,
            deadline: _deadline,
            votesFor: 0,
            votesAgainst: 0,
            vetoed: false,
            vetoReason: "",
            finalized: false,
            exists: true
        });

        emit ProposalCreated(_proposalId, _contentHash, _proposerUserId, _deadline);
    }

    function vote(string calldata _proposalId, address _voter, bool _inFavor) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "GovernanceRegistry: proposal does not exist");
        require(block.timestamp <= proposal.deadline, "GovernanceRegistry: voting period has ended");
        require(!proposal.vetoed, "GovernanceRegistry: proposal has been vetoed");
        require(!proposal.finalized, "GovernanceRegistry: proposal is already finalized");

        // Auth check: either msg.sender is the voter themselves, or msg.sender is the Elder (delegated voting via API)
        require(msg.sender == _voter || msg.sender == elder, "GovernanceRegistry: not authorized to vote for this address");

        Role voterRole = roles[_voter];
        require(voterRole == Role.MEMBER || voterRole == Role.ELDER, "GovernanceRegistry: voter is not a member or Elder");
        require(!hasVoted[_proposalId][_voter], "GovernanceRegistry: voter has already voted");

        uint256 weight = 1;
        if (voterRole == Role.ELDER) {
            weight = 3;
        }

        hasVoted[_proposalId][_voter] = true;

        if (_inFavor) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        emit VoteCast(_proposalId, _voter, _inFavor, weight);
    }

    function veto(string calldata _proposalId, string calldata _reason) external onlyElder {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "GovernanceRegistry: proposal does not exist");
        require(!proposal.vetoed, "GovernanceRegistry: proposal already vetoed");
        require(!proposal.finalized, "GovernanceRegistry: proposal already finalized");

        proposal.vetoed = true;
        proposal.vetoReason = _reason;

        emit ProposalVetoed(_proposalId, _reason);
    }

    function finalizeProposal(string calldata _proposalId) external onlyElder {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "GovernanceRegistry: proposal does not exist");
        require(!proposal.vetoed, "GovernanceRegistry: proposal has been vetoed");
        require(!proposal.finalized, "GovernanceRegistry: proposal already finalized");
        // We allow finalization even before the deadline if the Elder decides to finalize it,
        // or after the deadline.

        proposal.finalized = true;
        bool approved = proposal.votesFor > proposal.votesAgainst;

        emit ProposalFinalized(_proposalId, approved);
    }

    function getProposal(string calldata _proposalId) external view returns (
        string memory proposalId,
        string memory contentHash,
        string memory proposerUserId,
        uint256 deadline,
        uint256 votesFor,
        uint256 votesAgainst,
        bool vetoed,
        string memory vetoReason,
        bool finalized,
        bool exists
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "GovernanceRegistry: proposal does not exist");
        return (
            proposal.proposalId,
            proposal.contentHash,
            proposal.proposerUserId,
            proposal.deadline,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.vetoed,
            proposal.vetoReason,
            proposal.finalized,
            proposal.exists
        );
    }

    function getRole(address _member) external view returns (Role) {
        return roles[_member];
    }
}
