// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtisanCollectionNFT
 * @dev Contrato ERC-721 independiente para la colección de un artesano específico.
 * La propiedad del contrato se asigna a la fábrica global para restringir el minteo.
 */
contract ArtisanCollectionNFT is ERC721URIStorage, Ownable {
    address public immutable artisan;

    constructor(
        address _artisan,
        string memory _name,
        string memory _symbol,
        address _factory
    ) ERC721(_name, _symbol) Ownable(_factory) {
        artisan = _artisan;
    }

    /**
     * @notice Mintea un nuevo NFT de autenticidad en esta colección.
     * @dev Únicamente invocable por el contrato fábrica (propietario).
     * @param recipient Dirección de la billetera del comprador.
     * @param tokenId Identificador único del token (código de producto / número de serie).
     * @param tokenURI Enlace a los metadatos JSON del producto.
     */
    function mintNFT(
        address recipient,
        uint256 tokenId,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}
