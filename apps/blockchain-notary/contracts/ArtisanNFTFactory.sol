// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArtisanCollectionNFT.sol";

/**
 * @title ArtisanNFTFactory
 * @dev Fábrica de colecciones ERC-721 para artesanos.
 * Administra el despliegue automático de colecciones y el minteo de certificados.
 */
contract ArtisanNFTFactory {
    // Mapeo de artesano (wallet de vendedor) a su contrato de colección ERC-721
    mapping(address => address) public artisanToCollection;

    event CollectionCreated(address indexed artisan, address collectionAddress);
    event NFTMinted(address indexed artisan, address indexed recipient, uint256 indexed tokenId, string tokenURI);

    /**
     * @notice Despliega un nuevo contrato ArtisanCollectionNFT para un artesano.
     * @param artisan Dirección de la billetera del artesano (vendedor).
     * @param name Nombre de la colección.
     * @param symbol Símbolo del token.
     */
    function createCollection(
        address artisan,
        string memory name,
        string memory symbol
    ) external returns (address) {
        require(artisanToCollection[artisan] == address(0), "Collection already exists for artisan");

        ArtisanCollectionNFT newCollection = new ArtisanCollectionNFT(
            artisan,
            name,
            symbol,
            address(this) // La fábrica es el dueño inicial
        );

        address collectionAddress = address(newCollection);
        artisanToCollection[artisan] = collectionAddress;

        emit CollectionCreated(artisan, collectionAddress);
        return collectionAddress;
    }

    /**
     * @notice Mintea un NFT de autenticidad en la colección del artesano.
     * @dev Si el artesano no posee una colección, se despliega una por defecto.
     * @param artisan Dirección de la billetera del artesano.
     * @param recipient Dirección de la billetera del comprador.
     * @param tokenId Identificador único del token (hash de la orden / número de serie).
     * @param tokenURI Enlace con los metadatos OpenSea del producto.
     */
    function mintNFTForProduct(
        address artisan,
        address recipient,
        uint256 tokenId,
        string memory tokenURI
    ) external returns (uint256) {
        address collectionAddress = artisanToCollection[artisan];

        if (collectionAddress == address(0)) {
            collectionAddress = _createDefaultCollection(artisan);
        }

        ArtisanCollectionNFT(collectionAddress).mintNFT(recipient, tokenId, tokenURI);

        emit NFTMinted(artisan, recipient, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @dev Despliega una colección por defecto para artesanos que aún no tengan una creada.
     */
    function _createDefaultCollection(address artisan) internal returns (address) {
        ArtisanCollectionNFT newCollection = new ArtisanCollectionNFT(
            artisan,
            "AmazonIA Artisan Collection",
            "AMZART",
            address(this)
        );

        address collectionAddress = address(newCollection);
        artisanToCollection[artisan] = collectionAddress;

        emit CollectionCreated(artisan, collectionAddress);
        return collectionAddress;
    }
}
