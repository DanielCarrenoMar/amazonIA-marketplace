// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovernanceRegistry {

    // ── Roles ────────────────────────────────────────────────────────────
    enum Role { NONE, MEMBER, ELDER }

    mapping(address => Role) public roles;
    mapping(address => string) public userIds;     // address → userId del backend
    address public elder;
    uint256 public totalMembers;

    // ── Propuestas ───────────────────────────────────────────────────────
    enum ProposalStatus { PENDING, APPROVED, VETOED, CONFIRMED, FAILED }

    struct Proposal {
        string  proposalId;
        string  contentHash;
        string  proposerUserId;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 deadline;
        ProposalStatus status;
        bool    exists;
    }

    mapping(string => Proposal) public proposals;
    mapping(string => mapping(address => bool)) public hasVoted;
    uint256 public totalProposals;

    // ── Configuración ────────────────────────────────────────────────────
    uint256 public elderVoteWeight = 3;
    uint256 public quorumThreshold = 51;   // porcentaje

    // ── Eventos (cada uno queda grabado permanentemente en el bloque) ──
    event RoleAssigned(address indexed account, string userId, Role role, uint256 timestamp);
    event EldershipTransferred(address indexed oldElder, address indexed newElder, uint256 timestamp);
    event ProposalCreated(string indexed proposalId, string contentHash, string proposerUserId, uint256 deadline, uint256 timestamp);
    event VoteCast(string indexed proposalId, address indexed voter, string voterUserId, bool inFavor, uint256 weight, uint256 timestamp);
    event ProposalApproved(string indexed proposalId, uint256 votesFor, uint256 votesAgainst, uint256 timestamp);
    event ProposalVetoed(string indexed proposalId, string reason, uint256 timestamp);
    event ProposalFinalized(string indexed proposalId, uint256 timestamp);

    // ── Constructor (quien despliega es el primer Elder) ─────────────
    constructor() {
        elder = msg.sender;
        roles[msg.sender] = Role.ELDER;
        totalMembers = 1;
    }

    // ── Modificadores ────────────────────────────────────────────────────
    modifier onlyElder() {
        require(msg.sender == elder, "Solo el Elder puede ejecutar esto");
        _;
    }

    modifier onlyMemberOrElder() {
        require(
            roles[msg.sender] == Role.MEMBER || roles[msg.sender] == Role.ELDER,
            "Debes ser miembro o Elder"
        );
        _;
    }

    // ── Gestión de Roles ─────────────────────────────────────────────────

    function assignRole(address account, string calldata userId, Role role) external onlyElder {
        require(role != Role.ELDER, "Usa transferEldership para asignar Elder");
        if (roles[account] == Role.NONE && role == Role.MEMBER) {
            totalMembers++;
        }
        roles[account] = role;
        userIds[account] = userId;
        emit RoleAssigned(account, userId, role, block.timestamp);
    }

    function transferEldership(address newElder) external onlyElder {
        require(newElder != address(0), "Direccion invalida");
        address oldElder = elder;
        roles[oldElder] = Role.MEMBER;       // El Elder viejo baja a Member
        roles[newElder] = Role.ELDER;
        elder = newElder;
        if (roles[newElder] == Role.NONE) {
            totalMembers++;
        }
        emit EldershipTransferred(oldElder, newElder, block.timestamp);
    }

    // ── Propuestas ───────────────────────────────────────────────────────

    function createProposal(
        string calldata proposalId,
        string calldata contentHash,
        string calldata proposerUserId,
        uint256 deadline
    ) external onlyMemberOrElder {
        require(!proposals[proposalId].exists, "Propuesta ya existe");
        require(deadline > block.timestamp, "Deadline debe ser futuro");

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            contentHash: contentHash,
            proposerUserId: proposerUserId,
            votesFor: 0,
            votesAgainst: 0,
            createdAt: block.timestamp,
            deadline: deadline,
            status: ProposalStatus.PENDING,
            exists: true
        });
        totalProposals++;

        emit ProposalCreated(proposalId, contentHash, proposerUserId, deadline, block.timestamp);
    }

    function vote(string calldata proposalId, bool inFavor) external onlyMemberOrElder {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Propuesta no existe");
        require(p.status == ProposalStatus.PENDING, "Propuesta no esta abierta");
        require(block.timestamp <= p.deadline, "Votacion cerrada");
        require(!hasVoted[proposalId][msg.sender], "Ya votaste");

        hasVoted[proposalId][msg.sender] = true;

        uint256 weight = (roles[msg.sender] == Role.ELDER) ? elderVoteWeight : 1;

        if (inFavor) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        string memory voterUserId = userIds[msg.sender];
        emit VoteCast(proposalId, msg.sender, voterUserId, inFavor, weight, block.timestamp);

        // Chequear quórum automáticamente
        uint256 totalVotes = p.votesFor + p.votesAgainst;
        if (totalVotes > 0) {
            uint256 percentage = (p.votesFor * 100) / totalVotes;
            if (percentage >= quorumThreshold) {
                p.status = ProposalStatus.APPROVED;
                emit ProposalApproved(proposalId, p.votesFor, p.votesAgainst, block.timestamp);
            }
        }
    }

    function veto(string calldata proposalId, string calldata reason) external onlyElder {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Propuesta no existe");
        require(
            p.status == ProposalStatus.PENDING || p.status == ProposalStatus.APPROVED,
            "No se puede vetar en este estado"
        );

        p.status = ProposalStatus.VETOED;
        emit ProposalVetoed(proposalId, reason, block.timestamp);
    }

    function finalizeProposal(string calldata proposalId) external onlyElder {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Propuesta no existe");
        require(p.status == ProposalStatus.APPROVED, "Propuesta no esta aprobada");

        p.status = ProposalStatus.CONFIRMED;
        emit ProposalFinalized(proposalId, block.timestamp);
    }

    // ── Lecturas (gratis, sin gas) ───────────────────────────────────────

    function getProposal(string calldata proposalId) external view returns (Proposal memory) {
        require(proposals[proposalId].exists, "Propuesta no existe");
        return proposals[proposalId];
    }

    function getRole(address account) external view returns (Role) {
        return roles[account];
    }
}
