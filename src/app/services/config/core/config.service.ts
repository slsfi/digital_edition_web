import { Injectable } from '@angular/core';
import { get } from "lodash";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = {
    "app": {
        "readContent": "...",
        "machineName": "topelius",
        "projectId": 10,
        "useLegacyIdsForSemanticData": false,
        "legacyIdPrefix": "",
        "apiEndpoint": "https://api.sls.fi/digitaledition",
        "showViewToggle": false,
        "showTopURNButton": false,
        "showTopElasticButton": false,
        "showTopMusicButton": false,
        "siteLogoURL": "https://www.sls.fi",
        "page-title": {
            "sv": "",
            "fi": "",
            "en": ""
        },
        "name": {
            "sv": "Zacharias Topelius Skrifter",
            "fi": "Zacharias Topeliuksen Kirjoitukset",
            "en": "Zacharias Topeliuksen Kirjoitukset"
        },
        "subTitle1": {
            "sv": "Inte en dag utan en rad",
            "fi": "Fi: Författaren, redaktören, professorn och privatpersonen Zacharias Topelius verk i en textkritisk och kommenterad digital utgåva.",
            "en": "Zacharias Topeliuksen Kirjoitukset"
        },
        "subTitle2": {
            "sv": "Författaren, redaktören, professorn och privatpersonen Zacharias Topelius verk i en textkritisk och kommenterad digital utgåva.",
            "fi": "Fi: Författaren, redaktören, professorn och privatpersonen Zacharias Topelius verk i en textkritisk och kommenterad digital utgåva.",
            "en": "Zacharias Topeliuksen Kirjoitukset"
        },
        "CollectionSortOrder": {}
    },
    "frontpageConfig": {
        "imageOrientationIsPortrait": false,
        "imageOnRightIfPortrait": false,
        "siteTitleOnTopOfImageInMobileModeIfPortrait": false,
        "imageUrl": "assets/images/frontpage-image-landscape.jpg",
        "portraitImageUrlInMobileMode": "assets/images/frontpage-image-square.jpg",
        "portraitImageAltText": "",
        "showSimpleSearch": false,
        "showEditionList": false,
        "showFooter": false
    },
    "showURNButton": {
        "topMenu": false,
        "pageTitle": true,
        "pageForeword": true,
        "pageIntroduction": true,
        "pageRead": true,
        "pageEpub": false,
        "mediaCollection": true
    },
    "urnResolverUrl": "https://urn.fi/",
    "useSimpleWorkMetadata": false,
    "showOpenLegendButton": {
        "manuscripts": true,
        "variations": true
    },
    "showTutorial": false,
    "TutorialSteps": [{
            "id": "welcome",
            "intro": "WelcomeText",
            "show": true,
            "alreadySeen": false,
            "hideOn": [],
            "showOn": []
        },
        {
            "id": "menu",
            "element": "#menuToggle",
            "intro": "MenuToggleText",
            "show": true,
            "alreadySeen": false,
            "hideOn": [],
            "showOn": []
        },
        {
            "id": "readtoc",
            "element": "#readTocItem",
            "intro": "ReadTocItemText",
            "show": true,
            "alreadySeen": false,
            "hideOn": [
                "HomePage"
            ],
            "showOn": []
        },
        {
            "id": "downloadCache",
            "element": "#downloadPerson",
            "intro": "DownloadCacheText",
            "show": false,
            "alreadySeen": false,
            "hideOn": [],
            "showOn": [
                "PersonSearchPage"
            ]
        }
    ],
    "settings": {
        "readToggles": {
            "comments": true,
            "personInfo": true,
            "placeInfo": true,
            "workInfo": true,
            "changes": true,
            "normalisations": true,
            "abbreviations": true,
            "pageNumbering": true,
            "pageBreakOriginal": true,
            "pageBreakEdition": true
        },
        "introToggles": {
            "personInfo": false,
            "placeInfo": false,
            "workInfo": false,
            "pageNumbering": true,
            "pageBreakEdition": false
        },
        "displayTypesToggles": {
            "showAll": true,
            "established": true,
            "comments": true,
            "manuscripts": true,
            "variations": true,
            "facsimiles": true,
            "introduction": true,
            "songexample": false
        },
        "toolTips": {
            "comments": true,
            "personInfo": true,
            "placeInfo": true,
            "changes": true,
            "normalisations": true,
            "variations": true,
            "abbreviations": true,
            "workInfo": true,
            "footNotes": true
        },
        "enableModeToggle": true,
        "getFacsimilePagesInfinite": false,
        "showReadTextIllustrations": [],
        "galleryCollectionMapping": {"214": 44},
        "facsimileDefaultZoomLevel": 3,
        "facsimileZoomPageLevel": 1
    },
    "i18n": {
        "languages": [
			"sv", "fi"
        ],
        "locale": "sv",
        "enableLanguageChanges": false,
        "multilingualTOC": false,
        "multilingualEST": false,
        "estLanguages": []
    },
    "collectionDownloads": {
        "isDownloadOnly": false,
        "pdf": [{
            "pdfFile": "12_3456_sample.pdf",
            "thumbnail": "12_3456.png",
            "title": "Sample PDF title",
            "collectionId": "12",
            "facsimileId": "789",
            "publicationId": "3456",
            "child": false
        }],
        "epub": {}
    },
    "simpleSearch": {
        "showPageNumbers": false,
        "user_defined_search_fields": [
            "textData"
        ]
    },
    "editionImages": {
        "default": "assets/images/edition-default-cover.jpg",
        "1": "assets/images/omslag_1.jpg",
        "4": "assets/images/omslag_4.jpg",
        "5": "assets/images/omslag_4.jpg",
        "10": "assets/images/omslag_10.jpg",
        "12": "assets/images/omslag_12.jpg",
        "13": "assets/images/omslag_13.jpg",
        "15": "assets/images/omslag_15.jpg",
        "20": "assets/images/omslag_20.jpg"
    },
    "editionShortTexts": {
        "sv": {
            "default": "En undertitel med lite data...",
            "1": "Tidiga dikter",
            "15": "Korrespondens med förlag och förläggare",
            "4": "Tolv noveller, ursprungligen publicerade som följetonger",
            "5": "Fyra historiska noveller",
            "12": "Historiskt-geografiskt bildverk",
            "13": "Historiskt-geografiskt bildverk",
            "10": "Läseböcker för folkskolan",
            "20": "   "
        },
        "fi": {
            "default": "FI - En undertitel med lite data...",
            "1": "FI - Tidiga dikter",
            "15": "FI - Korrespondens med förlag och förläggare",
            "4": "FI - Tolv noveller, ursprungligen publicerade som följetonger",
            "5": "FI - Fyra historiska noveller"
        },
        "en": {
            "default": "a Subtitle...",
            "29": "Hilma Granqvists Diaries",
            "30": "Download PDF",
            "31": "Download PDF2"
        }
    },
    "single-editions": {
        "sv": {
            "toc": "Innehåll"
        },
        "fi": {
            "toc": "Lue digitaalisesti"
        }
    },
    "staticPages": {
        "about_index": 0,
        "frontpage": {
            "sv": {
                "name": "Hem",
                "file": "frontpage-sv"
            },
            "fi": {
                "name": "Koti",
                "file": "frontpage-fi"
            }
        },
        "editions": {
            "sv": {
                "name": "Läs digitalt",
                "file": "editions-sv"
            },
            "fi": {
                "name": "Lue digitaalisesti",
                "file": "editions-fi"
            }
        },
        "about": [{
                "sv": {
                    "name": "Om utgåvan",
                    "file": "about--about-edition-sv"
                },
                "fi": {
                    "name": "Testi",
                    "file": "about--about-edition-fi"
                }
            },
            {
                "sv": {
                    "name": "Rättelser och tillägg",
                    "file": "about--corrections-and-additions-sv"
                },
                "fi": {
                    "name": "Testi",
                    "file": "about--corrections-and-additions-fi"
                }
            },
            {
                "sv": {
                    "name": "Om mobilversionen",
                    "file": "about--mobile-limitations-sv"
                },
                "fi": {
                    "name": "Testi",
                    "file": "about--mobile-limitations-fi"
                }
            },
            {
                "sv": {
                    "name": "Organisation och kontakt",
                    "file": "about--organisation-and-contact-sv"
                },
                "fi": {
                    "name": "Testi",
                    "file": "about--organisation-and-contact-fi"
                }
            },
            {
                "sv": {
                    "name": "Om Topelius",
                    "file": "about--about-author-sv"
                },
                "fi": {
                    "name": "Testi",
                    "file": "about--organisation-and-contact-fi"
                }
            }
        ]
    },
    "galleryImages": {
        "0": {
            "prefix": "FFiT_",
            "numberOfImages": 120
        },
        "1": {
            "prefix": "ERiF_",
            "numberOfImages": 39
        },
        "2": {
            "prefix": "foo_",
            "numberOfImages": 0
        }
    },
    "show": {
        "TOC": {
            "Home": true,
            "About": true,
            "Read": true,
            "Facsimiles": true,
            "ImageGallery": true,
            "MediaCollections": true,
            "PersonSearch": true,
            "PlaceSearch": true,
            "TagSearch": true,
            "WorkSearch": true,
            "SongTypes": false,
            "Books": false,
            "splitReadCollections":[],
            "EPUB": false
        }
    },
    "defaults": {
        "ReadModeView": "established"
    },
    "cache": {
        "viewmodes": {
            "daysUntilExpires": 2
        }
    },
    "PersonSearchTypes": [{
        "object_type": "subject",
        "object_subtype": "",
        "translation": "TOC.PersonSearch"
    }],
    "ImageGallery": {
      "ShowInReadMenu": true
    },
    "PersonSearch": {
        "ShowFilter": true,
        "ShowPublishedStatus": 2,
        "InitialLoadNumber": 800
    },
    "LocationSearch": {
        "ShowFilter": true,
        "ShowPublishedStatus": 2
    },
    "TagSearch": {
        "ShowFilter": true,
        "ShowPublishedStatus": 2
    },
    "StaticPagesMenus": [{
        "menuID": "aboutMenu",
        "idNumber": "03",
        "hasMenuConditional": false,
        "initialAboutPage": "03-01-01"
    }],
    "Occurrences": {
      "HideTypeAndDescription": false,
      "ShowPublishedStatus": 2
    },
    "StaticPagesMenusInTOC": [],
    "LoadCollectionsFromAssets": false,
    "LoadTitleFromDB": true,
    "StaticMarkdownCovers": false,
    "ProjectStaticMarkdownCoversFolder": "08",
    "ProjectStaticMarkdownTitleFolder": "05",
    "showOccurencesModalOnReadPageAfterSearch": {
        "tagSearch": true,
        "personSearch": false,
        "placeSearch": false
    },
    "SortCollectionsByRomanNumerals": false,
    "AccordionTOC": false,
    "AccordionMusic": false,
    "SearchTocItemInAccordionByTitle": false,
    "AccordionsExpandedDefault": {
        "SongTypes": false,
        "Music": false
    },
    "MusicAccordion": {
        "PersonSearchTypes": false,
        "TagSearch": false,
        "PlaceSearch": false,
        "Music": false
    },
    "HasCover": true,
    "HasTitle": true,
    "HasForeword": true,
    "HasIntro": true,
    "defaultSelectedItem": "cover",
    "SidemenuMobile": true,
    "OpenOccurrencesAndInfoOnNewPage": false,
    "SingleOccurrenceType": null,
    "HideBackButton": {
        "TopMenu": true
    },
    "MusicPage": {
        "collectionsToShow": []
    },
    "separeateIntroductionToc": false,
    "ElasticSearch": {
        "indices": [
            "topelius"
        ],
        "fixedFilters": [{
            "terms": {
                "publication_data.published": [
                    2
                ]
            }
        }],
        "types": [
            "est",
            "com",
            "var",
            "inl",
            "tit",
            "ms"
        ],
        "hitsPerPage": 20,
        "source": [
            "xml_type",
            "TitleIndexed",
            "publication_data",
            "publication_locations",
            "publication_subjects",
            "publication_tags",
            "name",
            "collection_name",
            "orig_date_year_uncertain",
            "orig_date_certain",
            "receiver_subject_name",
            "sender_subject_name",
            "receiver_location_name",
            "sender_location_name"
        ],
        "aggregations": {
            "Years": {
                "date_histogram": {
                    "field": "orig_date_certain",
                    "calendar_interval": "year",
                    "format": "yyyy"
                }
            },
            "Type": {
                "terms": {
                    "field": "xml_type.keyword",
                    "size": 40
                }
            },
            "Genre": {
                "terms": {
                    "field": "publication_data.genre.keyword",
                    "size": 40
                }
            },
            "Collection": {
                "terms": {
                    "field": "publication_data.colname.keyword",
                    "size": 40
                }
            },
            "Location": {
                "terms": {
                    "field": "publication_locations.keyword",
                    "size": 40
                }
            },
            "Subjects": {
                "terms": {
                    "field": "publication_subjects.keyword",
                    "size": 40
                }
            },
            "Tags": {
                "terms": {
                    "field": "publication_tags.keyword",
                    "size": 40
                }
            },
            "Person": {
                "terms": {
                    "field": "persName.keyword",
                    "size": 40
                }
            },
            "LetterSenderName": {
                "terms": {
                    "field": "sender_subject_name.keyword",
                    "size": 40
                }
            },
            "LetterReceiverName": {
                "terms": {
                    "field": "receiver_subject_name.keyword",
                    "size": 40
                }
            },
            "LetterSenderLocation": {
                "terms": {
                    "field": "sender_location_name.keyword",
                    "size": 40
                }
            },
            "LetterReceiverLocation": {
                "terms": {
                    "field": "receiver_location_name.keyword",
                    "size": 40
                }
            }
        },
        "suggestions": {
            "LetterSenderName": {
                "field": "sender_subject_name",
                "size": 3
            },
            "LetterSenderLocation": {
                "field": "sender_location_name",
                "size": 3
            }
        }
    },
    "OpenCollectionFromToc": true,
    "siteMetaData": {
      "keywords": "Digital Edition",
      "description": "A Platform for Digital Editions",
      "website": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "sls.fi",
        "alternateName": "Svenska litteratursällskapet i Finland",
        "url": "https://www.sls.fi",
        "sameAs": ["", ""]
      },
      "organization": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "url":"https://www.sls.fi",
        "logo":"https://granska-topelius.sls.fi/assets/images/logo.svg"
      }
    },
    "AvailableEpubs": {
      "Dagböcker": {
        "filename": "NY_soderholm_dagbocker.epub",
        "download": "https://www.sls.fi/sv/utgivning/kerstin-soderholms-dagbocker"
      }
    },
    "textDownloadOptions": {
        "enabledIntroductionFormats": {
            "xml": true,
            "print": true
        },
        "enabledEstablishedFormats": {
            "xml": true,
            "txt": true,
            "print": true
        },
        "enabledCommentsFormats": {
            "xml": true,
            "txt": true,
            "print": true
        },
        "usePrintNotDownloadIcon": false
    },
    "showDisplayOptionsButton": {
        "pageTitle": true,
        "pageForeword": true,
        "pageIntroduction": true,
        "pageRead": true,
        "pageEpub": true
    }
}

  private config2 = {
    "app": {
      "readContent": "...",
      "machineName": "topelius",
      "projectId": 10,
      "useLegacyIdsForSemanticData": false,
      "legacyIdPrefix": "",
      "apiEndpoint": "https://api.sls.fi/digitaledition",
      "page-title": {
        "sv": "",
        "fi": "",
        "en": ""
      },
      "name": {
        "sv": "Zacharias Topelius Skrifter",
        "fi": "Zacharias Topelius Skrifter",
        "en": "Zacharias Topelius Skrifter"
      },
      "subTitle1": {
        "sv": "",
        "fi": ""
      },
      "subTitle2": {
        "sv": "",
        "fi": ""
      },
      "showTopMusicButton": false,
      "showHelpButton": false,
      "showViewToggle": true,
      "showTopURNButton": false,
      "showTopElasticButton": true,
      "showTopSimpleSearchButton": false,
      "showTopContentButton": true,
      "showTopAboutButton": false,
      "CollectionSortOrder": {
        "216":1, "219":2, "220":3, "218":4, "210":5, "208":6, "207":7, "214":8,
        "203":9, "213":10, "202":11, "199":12, "221":13,
        "206":14, "201":15, "211":16, "200":17,
        "205":18, "215":19, "217":20, "204":21, "212":22, "209":23
      }
    },
    "frontpageConfig": {
      "imageOrientationIsPortrait": true,
      "imageOnRightIfPortrait": false,
      "siteTitleOnTopOfImageInMobileModeIfPortrait": false,
      "imageUrl": "assets/images/frontpage-image-portrait.jpg",
      "portraitImageUrlInMobileMode": "assets/images/frontpage-image-square.jpg",
      "portraitImageAltText": "Zacharias Topelius",
      "showSimpleSearch": false,
      "showEditionList": false,
      "showFooter": true
    },
    "showURNButton": {
      "topMenu": false,
      "pageTitle": true,
      "pageForeword": true,
      "pageIntroduction": true,
      "pageRead": true,
      "pageEpub": false,
      "mediaCollection": false
    },
    "urnResolverUrl": "https://urn.fi/",
    "useSimpleWorkMetadata": true,
    "showOpenLegendButton": {
      "manuscripts": true,
      "variations": true
    },
    "showTutorial" : false,
    "TutorialSteps": [
      {
        "id": "welcome",
        "intro": "WelcomeText",
        "show": true,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": ["HomePage"]
      },
      {
        "id": "menuToggle",
        "element": "#menuToggle",
        "intro": "MenuToggleText",
        "show": true,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": ["HomePage"]
      },
      {
        "id": "readTocItem",
        "element": "#readTocItem",
        "intro": "ReadTocItemText",
        "show": false,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": []
      },
      {
        "id": "downloadPerson",
        "element": "#downloadPerson",
        "intro": "DownloadCacheText",
        "show": false,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": []
      },
      {
        "id": "searchIcon",
        "element": "#searchIcon",
        "intro": "SearchIconText",
        "show": true,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": ["HomePage"]
      },
      {
        "id": "settings-icon",
        "element": "#settings-icon",
        "intro": "SettingsIconText",
        "show": false,
        "alreadySeen": false,
        "hideOn": ["HomePage"],
        "showOn": ["ReadPage"]
      },
      {
        "id": "download-icon",
        "element": "#download-icon",
        "intro": "DownloadIconText",
        "show": false,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": []
      },
      {
        "id": "readFabMenu",
        "element": "#readFabMenu",
        "intro": "FabMenuText",
        "show": false,
        "alreadySeen": false,
        "hideOn": ["HomePage"],
        "showOn": ["ReadPage"]
      },
      {
        "id": "tabs-text-container",
        "element": "#tabs-text-container",
        "intro": "TabsTextContainerText",
        "show": false,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": []
      },
      {
        "id": "facsimilies-image",
        "element": "#facsimilies-image",
        "intro": "ImagesText",
        "show": false,
        "alreadySeen": false,
        "hideOn": [],
        "showOn": []
      },
      {
        "id": "link-page-button",
        "element": "#link-page-button",
        "intro": "Link page",
        "show": false,
        "alreadySeen": true,
        "hideOn": [],
        "showOn": []
      }
    ],
    "settings": {
      "disableReadToggles": false,
      "readToggles": {
        "comments": true,
        "personInfo": true,
        "placeInfo": true,
        "changes": true,
        "normalisations": true,
        "workInfo": true,
        "abbreviations": true,
        "pageNumbering": true,
        "pageBreakOriginal": true,
        "pageBreakEdition": true
      },
      "introToggles": {
        "personInfo": true,
        "placeInfo": false,
        "workInfo": true,
        "pageNumbering": true,
        "pageBreakEdition": true
      },
      "displayTypesToggles": {
        "showAll": true,
        "established": true,
        "comments": true,
        "manuscripts": true,
        "variations": true,
        "facsimiles": true,
        "introduction": false,
        "illustrations": true,
        "legend": true
      },
      "toolTips": {
        "comments": true,
        "personInfo": true,
        "placeInfo": true,
        "changes": true,
        "normalisations": true,
        "variations": true,
        "abbreviations": true,
        "workInfo": true,
        "footNotes": true
      },
      "enableModeToggle": true,
      "getFacsimilePagesInfinite": true,
      "facsimileDefaultZoomLevel": 4,
      "facsimileZoomPageLevel": 1,
      "galleryCollectionMapping": {"214": 44, "206": 19},
      "showReadTextIllustrations": ["20212", "20213", "206"],
      "sortableLetters": ["220", "219", "215", "211"]
    },
    "i18n": {
      "languages": [
        "sv", "fi"
      ],
      "locale": "sv",
      "enableLanguageChanges": true
    },
    "collectionDownloads": {
      "isDownloadOnly": false,
      "pdf": {},
      "epub": {}
    },
    "textDownloadOptions": {
      "enabledIntroductionFormats": {
          "xml": true,
          "print": true
      },
      "enabledEstablishedFormats": {
          "xml": true,
          "txt": false,
          "print": true
      },
      "enabledCommentsFormats": {
          "xml": true,
          "txt": false,
          "print": true
      },
      "usePrintNotDownloadIcon": false
    },
    "simpleSearch": {
      "showPageNumbers": false,
      "user_defined_search_fields": [
        "textData"
      ]
    },
    "editionImages": {
      "default": "assets/images/edition-default-cover.jpg",
      "199": "assets/images/verk/omslag/omslag_199_ljungblommor.jpg",
      "200": "assets/images/verk/omslag/omslag_200_nya_blad_och_ljung.jpg",
      "201": "assets/images/verk/omslag/omslag_201_noveller.jpg",
      "202": "assets/images/verk/omslag/omslag_202_hertiginnan_af_finland.jpg",
      "203": "assets/images/verk/omslag/omslag_203_faltskarns_berattelser.jpg",
      "204": "assets/images/verk/omslag/omslag_204_vinterqvallar.jpg",
      "205": "assets/images/verk/omslag/omslag_205_planeternas_skyddslingar.jpg",
      "206": "assets/images/verk/omslag/omslag_206_naturens_bok_och_boken_om_vart_land.jpg",
      "207": "assets/images/verk/omslag/omslag_207_finland_framstalldt_i_teckningar.jpg",
      "208": "assets/images/verk/omslag/omslag_208_en_resa_i_finland.jpg",
      "209": "assets/images/verk/omslag/omslag_209_ovrig_lyrik.jpg",
      "210": "assets/images/verk/omslag/omslag_210_dramatik.jpg",
      "211": "assets/images/verk/omslag/omslag_211_noveller_och_kortprosa.jpg",
      "212": "assets/images/verk/omslag/omslag_212_ovrig_barnlitteratur.jpg",
      "213": "assets/images/verk/omslag/omslag_213_forelasningar.jpg",
      "214": "assets/images/verk/omslag/omslag_214_finland_i_19de_seklet.jpg",
      "215": "assets/images/verk/omslag/omslag_215_publicistik.jpg",
      "216": "assets/images/verk/omslag/omslag_216_academica.jpg",
      "217": "assets/images/verk/omslag/omslag_217_religiosa_skrifter_och_psalmer.jpg",
      "218": "assets/images/verk/omslag/omslag_218_dagbocker.jpg",
      "219": "assets/images/verk/omslag/omslag_219_forlagskorrespondens.jpg",
      "220": "assets/images/verk/omslag/omslag_220_foraldrakorrespondens.jpg",
      "221": "assets/images/verk/omslag/omslag_221_lasning_for_barn.jpg"
    },
    "editionShortTexts": {
      "sv": {
        "default": "En undertitel med lite data...",
        "199": "Tidiga dikter",
        "220": "Korrespondens med förlag och förläggare",
        "201": "Tolv noveller, ursprungligen publicerade som följetonger",
        "178": "Fyra historiska noveller",
        "207": "Historiskt-geografiskt bildverk",
        "208": "Historiskt-geografiskt bildverk",
        "206": "Läseböcker för folkskolan",
        "190": "   "
      },
      "fi": {
        "default": "FI - En undertitel med lite data...",
        "175": "FI - Tidiga dikter",
        "197": "FI - Korrespondens med förlag och förläggare",
        "177": "FI - Tolv noveller, ursprungligen publicerade som följetonger",
        "178": "FI - Fyra historiska noveller",
        "184": "",
        "185": ""
      },
      "en": {
        "default": "a Subtitle..."
      }
    },
    "single-editions": {
      "sv": {
        "toc": "Innehåll"
      },
      "fi": {
        "toc": "Lue digitaalisesti"
      }
    },
    "staticPages": {
      "about_index": 0,
      "frontpage": {
        "sv": {
          "name": "Hem",
          "file": "frontpage-sv"
        },
        "fi": {
          "name": "Koti",
          "file": "frontpage-fi"
        }
      },
      "editions": {
        "sv": {
          "name": "Läs digitalt",
          "file": "editions-sv"
        },
        "fi": {
          "name": "Lue digitaalisesti",
          "file": "editions-fi"
        }
      },
      "about": [{
          "sv": {
            "name": "Om utgåvan",
            "file": "about--about-edition-sv"
          },
          "fi": {
            "name": "Testi",
            "file": "about--about-edition-fi"
          }
        },
        {
          "sv": {
            "name": "Rättelser och tillägg",
            "file": "about--corrections-and-additions-sv"
          },
          "fi": {
            "name": "Testi",
            "file": "about--corrections-and-additions-fi"
          }
        },
        {
          "sv": {
            "name": "Om mobilversionen",
            "file": "about--mobile-limitations-sv"
          },
          "fi": {
            "name": "Testi",
            "file": "about--mobile-limitations-fi"
          }
        },
        {
          "sv": {
            "name": "Organisation och kontakt",
            "file": "about--organisation-and-contact-sv"
          },
          "fi": {
            "name": "Testi",
            "file": "about--organisation-and-contact-fi"
          }
        },
        {
          "sv": {
            "name": "Om Topelius",
            "file": "about--about-author-sv"
          },
          "fi": {
            "name": "Testi",
            "file": "about--organisation-and-contact-fi"
          }
        }
      ]
    },
    "galleryImages": {
      "0": {
        "prefix": "FFiT_",
        "numberOfImages": 120
      },
      "1": {
        "prefix": "ERiF_",
        "numberOfImages": 39
      },
      "2": {
        "prefix": "foo_",
        "numberOfImages": 0
      }
    },
    "show": {
      "TOC": {
        "Home": false,
        "About": true,
        "Read": true,
        "Facsimiles": false,
        "ImageGallery": false,
        "PersonSearch": true,
        "PlaceSearch": true,
        "MediaCollections": true,
        "TagSearch": false,
        "WorkSearch": false,
        "SongTypes": false,
        "Books": false
      },
      "highlightedSearchMatches": true
    },
    "defaults": {
      "ReadModeView": ["established", "comments", "facsimiles"]
    },
    "defaultSelectedItem": "cover",
    "cache": {
      "viewmodes": {
        "daysUntilExpires": 1
      }
    },
    "PersonSearchTypes": [{
      "object_type": "subject",
      "object_subtype": "",
      "translation": "TOC.PersonSearch"
    }],
    "PersonSearch": {
      "ShowFilter": true,
      "ShowPublishedStatus": 2,
      "InitialLoadNumber": 500
    },
    "LocationSearch": {
      "ShowFilter": false,
      "ShowPublishedStatus": 2,
      "InitialLoadNumber": 500
    },
    "TagSearch": {
      "ShowFilter": false,
      "ShowPublishedStatus": 2
    },
    "ImageGallery": {
      "ShowInReadMenu": false
    },
    "Occurrences": {
      "HideTypeAndDescription": true,
      "hideCityRegionCountry": true,
      "ShowPublishedStatus": 2
    },
    "StaticPagesMenus": [{
      "menuID": "aboutMenu",
      "idNumber": "03",
      "hasMenuConditional": false
    }],
    "StaticPagesMenusInTOC": [{
      "menuID": "aboutMenu",
      "idNumber": "03",
      "hasMenuConditional": false
    }],
    "GoogleAnalyticsId": "G-45Hfdfd2KLT2Y",
    "LoadCollectionsFromAssets": false,
    "LoadTitleFromDB": true,
    "StaticMarkdownCovers": false,
    "ProjectStaticMarkdownCoversFolder": "08",
    "ProjectStaticMarkdownTitleFolder": "",
    "showOccurencesModalOnReadPageAfterSearch": {
      "tagSearch": true,
      "personSearch": true,
      "placeSearch": true,
      "workSearch": true
    },
    "SortCollectionsByRomanNumerals": false,
    "AccordionTOC": true,
    "OpenCollectionFromToc": true,
    "AccordionMusic": false,
    "SearchTocItemInAccordionByTitle": false,
    "AccordionsExpandedDefault": {
      "SongTypes": false,
      "Music": false
    },
    "MusicAccordion": {
      "PersonSearchTypes": false,
      "TagSearch": false,
      "PlaceSearch": false,
      "Music": false
    },
    "AboutMenuAccordion": true,
    "HasCover": true,
    "HasTitle": true,
    "HasForeword": true,
    "HasIntro": true,
    "separeateIntroductionToc": true,
    "SidemenuMobile": true,
    "OpenOccurrencesAndInfoOnNewPage": false,
    "SingleOccurrenceType": null,
    "HideBackButton": {
      "TopMenu": true
    },
    "MusicPage": {
      "collectionsToShow": []
    },
    "ElasticSearch": {
      "show": {
        "sortOptions": true,
        "facets": true
      },
      "textTitleHighlightType": "fvh",
      "textHighlightType": "fvh",
      "groupOpenByDefault": {
        "type": true,
        "genre": true,
        "collection": true
      },
      "indices": [
        "topelius"
      ],
      "fixedFilters": [
        {
          "terms": {
            "deleted": [
              "0"
            ]
          }
        },
        {
          "terms": {
            "published": [
              "2"
            ]
          }
        }
      ],
      "types": [
        "est",
        "com",
        "var",
        "inl",
        "tit",
        "fore"
      ],
      "hitsPerPage": 15,
      "source": [
      ],
      "aggregations": {
        "Years": {
          "date_histogram": {
            "field": "orig_date_sort",
            "calendar_interval": "year",
            "format": "yyyy"
          }
        },
        "Type": {
          "terms": {
            "field": "text_type",
            "size": 40
          }
        },
        "Genre": {
          "terms": {
            "field": "publication_data.genre.keyword",
            "size": 40
          }
        },
        "Collection": {
          "terms": {
            "field": "publication_data.collection_name.keyword",
            "size": 40
          }
        },
        "LetterSenderName": {
          "terms": {
            "field": "sender_subject_name.keyword",
            "size": 100
          }
        },
        "LetterReceiverName": {
          "terms": {
            "field": "receiver_subject_name.keyword",
            "size": 100
          }
        },
        "LetterSenderLocation": {
          "terms": {
            "field": "sender_location_name.keyword",
            "size": 50
          }
        },
        "LetterReceiverLocation": {
          "terms": {
            "field": "receiver_location_name.keyword",
            "size": 50
          }
        }
      },
      "suggestions": {
      }
    },
    "siteMetaData": {
      "keywords": "Zacharias Topelius Skrifter, digital edition, digital utgåva",
      "description": "En textkritisk, kommenterad utgåva av Zacharias Topelius (1818–1898) författarskap",
      "website": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "topelius.sls.fi",
        "alternateName": "Zacharias Topelius Skrifter",
        "url": "https://topelius.sls.fi",
        "sameAs": ["http://www.topelius.fi", "http://topelius.sls.fi"]
      },
      "organization": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "url":"https://topelius.sls.fi",
        "logo":"https://topelius.sls.fi/assets/images/logo.svg"
      }
    }
  }

  constructor() { }


  getSettings(key: string) {
    const result = get(this.config2, key);

    if (result === undefined) {
      throw new Error(
        `No setting found with the specified key ${key}!`
      );
    }

    return result;
  }
}
