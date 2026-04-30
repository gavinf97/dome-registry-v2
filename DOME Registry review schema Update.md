{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "$id": "https://github.com/BioComputingUP/dome-schema/blob/main/releases/v2.0.0/dome-registry-schema.json",  
  "title": "DOME Registry Schema v2",  
  "type": "object",  
  "properties": {  
    "x-dome-schema-version": {  
      "type": "string",  
      "const": "2.0.0",  
      "description": "The version of the DOME schema being used."  
    },  
    "\_id": {  
      "type": "string",  
      "description": "MongoDB internal document ID."  
    },  
    "user": {  
      "type": "string",  
      "description": "MongoDB internal user ID of the creator."  
    },  
    "uuid": {  
      "type": "string",  
      "format": "uuid",  
      "description": "Globally unique identifier for the registry entry."  
    },  
    "shortid": {  
      "type": "string",  
      "pattern": "^\[a-zA-Z0-9\]+$",  
      "description": "A short, URL-friendly alphanumeric identifier."  
    },  
    "public": {  
      "type": "boolean",  
      "description": "Indicates if the entry is publicly visible."  
    },  
    "isAiGenerated": {  
      "type": "boolean",  
      "description": "Indicates if the entry was generated or assisted by AI."  
    },  
    "created": {  
      "type": "string",  
      "format": "date-time",  
      "description": "Creation timestamp in strict ISO 8601 format (e.g. 2022-09-01T15:16:05.446Z)."  
    },  
    "updated": {  
      "type": "string",  
      "format": "date-time",  
      "description": "Last updated timestamp in strict ISO 8601 format."  
    },  
    "tags": {  
      "type": "array",  
      "items": {  
        "type": "string"  
      },  
      "description": "General user-defined tags for the entry."  
    },  
    "score": {  
      "type": "number",  
      "description": "DOME quality score, automatically calculated."  
    },  
    "publication": {  
      "type": "object",  
      "properties": {  
        "title": {  
          "type": "string",  
          "description": "Title of the publication."  
        },  
        "authors": {  
          "type": "string",  
          "description": "Authors of the publication."  
        },  
        "journal": {  
          "type": "string",  
          "description": "Journal name."  
        },  
        "year": {  
          "type": "string",  
          "pattern": "^\\\\d{4}$",  
          "description": "Year of publication. Must be exactly 4 digits (e.g., 2023)."  
        },  
        "doi": {  
          "type": "string",  
          "pattern": "^10\\\\.\\\\d{4,9}/\[-.\_;()/:A-Za-z0-9\]+$",  
          "description": "Digital Object Identifier. Must begin with 10\. followed by the standard DOI prefix and suffix structure."  
        },  
        "pmid": {  
          "type": "string",  
          "pattern": "^\\\\d{1,8}$",  
          "description": "PubMed Identifier. Must be a numeric string up to 8 digits."  
        },  
        "pmcid": {  
          "type": "string",  
          "pattern": "^PMC\\\\d{7}$",  
          "description": "PubMed Central Identifier. Must begin with PMC followed by exactly 7 digits."  
        },  
        "done": {  
          "type": "integer",  
          "description": "Internal flag tracking completion status."  
        },  
        "skip": {  
          "type": "integer",  
          "description": "Internal flag tracking skipped status."  
        },  
        "tags": {  
          "type": "array",  
          "items": {  
            "type": "string"  
          },  
          "description": "Tags specific to the publication."  
        }  
      }  
    },  
    "data": {  
      "type": "object",  
      "properties": {  
        "provenance": {  
          "type": "object",  
          "properties": {  
            "datasetSource": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "enum": \[  
                  "database",  
                  "publication",  
                  "directExperiment",  
                  "synthetic",  
                  "hybrid",  
                  "other"  
                \]  
              },  
              "description": "What is the source of the data? (Select all that apply: database, publication, direct experiment, etc.)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "pointsPerClass": {  
              "type": "string",  
              "description": "If data are in classes, how many data points are available in each class, for example, Npos and Nneg?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "regressionPoints": {  
              "type": \[  
                "integer",  
                "string"  
              \],  
              "description": "If regression, how many real value points are there?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "previouslyUsed": {  
              "type": "boolean",  
              "description": "Has the dataset been previously used by other papers and/or is it recognized by the community?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "dataSplits": {  
          "type": "object",  
          "properties": {  
            "trainTestPoints": {  
              "type": "string",  
              "description": "How many data points are in the training and test sets?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "validationUsed": {  
              "type": "boolean",  
              "description": "Was a separate validation set used?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "validationSize": {  
              "type": \[  
                "integer",  
                "string"  
              \],  
              "description": "If a separate validation set was used, how large was it?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "distributionsDifferent": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the distributions of data types in the training and test sets different?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "distributionsPlotted": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the distributions of data types in both training and test sets plotted?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "redundancy": {  
          "type": "object",  
          "properties": {  
            "splitMethod": {  
              "type": "string",  
              "description": "How were the sets split?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "setsIndependent": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the training and test sets independent?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "independenceEnforcement": {  
              "type": "string",  
              "description": "How was this enforced (for example, redundancy reduction to less than X% pairwise identity)?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "distributionComparison": {  
              "type": "string",  
              "description": "How does the distribution compare to previously published ML datasets?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "availability": {  
          "type": "object",  
          "properties": {  
            "isDataPublic": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the data, including the data splits used, released in a public forum?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "dataUrl": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "format": "uri"  
              },  
              "description": "If public, where are the URLs? (Can provide multiple)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "dataLicence": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "x-options-api": "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json",  
              "description": "If public, what are the licences? (Values fetched from SPDX API)",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        }  
      }  
    },  
    "optimization": {  
      "type": "object",  
      "properties": {  
        "algorithm": {  
          "type": "object",  
          "properties": {  
            "algorithmClass": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "x-options-api": "[http://edamontology.org/topic\_3474](http://edamontology.org/topic_3474)",  
              "description": "Which ML algorithm classes are used? (Values fetched from EDAM Ontology)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "isAlgorithmNew": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is the ML algorithm new?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "newAlgorithmJustification": {  
              "type": "string",  
              "description": "If yes, why was it chosen over better known alternatives?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "metaPredictions": {  
          "type": "object",  
          "properties": {  
            "usesMetaPredictions": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Does the model use data from other ML algorithms as input?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "metaPredictionAlgorithms": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "description": "If yes, which algorithms are used?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "metaPredictorIndependence": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is it clear that training data of initial predictors and meta-predictor are independent of test data for the meta-predictor?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "encoding": {  
          "type": "object",  
          "properties": {  
            "dataEncodingMethod": {  
              "type": "string",  
              "description": "How were the data encoded and preprocessed for the ML algorithm?",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "parameters": {  
          "type": "object",  
          "properties": {  
            "numberOfParameters": {  
              "type": \[  
                "integer",  
                "string"  
              \],  
              "description": "How many parameters are used in the model?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "parameterSelectionMethod": {  
              "type": "string",  
              "description": "How were the parameters selected?",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "features": {  
          "type": "object",  
          "properties": {  
            "numberOfFeatures": {  
              "type": \[  
                "integer",  
                "string"  
              \],  
              "description": "How many features are used as input?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "featureSelectionPerformed": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Was feature selection performed?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "featureSelectionTrainingOnly": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "If yes, was it performed using the training set only?",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "fitting": {  
          "type": "object",  
          "properties": {  
            "parametersExceedData": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is the number of parameters much larger than the number of training points, and/or is the number of features large?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "overfittingPrevention": {  
              "type": "string",  
              "description": "If yes, how was overfitting ruled out?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "underfittingPrevention": {  
              "type": "string",  
              "description": "Conversely, if the number of training points is much larger than the parameters and/or features is small, how was underfitting ruled out?",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "regularization": {  
          "type": "object",  
          "properties": {  
            "regularizationUsed": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Were any overfitting prevention techniques used?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "regularizationTechniques": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "description": "If yes, which techniques were used?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "configAvailability": {  
          "type": "object",  
          "properties": {  
            "configReported": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the hyperparameter configurations, optimization schedule, model files and optimization parameters reported?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "configUrl": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "format": "uri"  
              },  
              "description": "If reported, where are the URLs? (Can provide multiple)",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "configLicence": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "x-options-api": "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json",  
              "description": "If reported, what are the licences? (Values fetched from SPDX API)",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        }  
      }  
    },  
    "model": {  
      "type": "object",  
      "properties": {  
        "interpretability": {  
          "type": "object",  
          "properties": {  
            "interpretabilityType": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "enum": \[  
                  "black box",  
                  "interpretable",  
                  "hybrid"  
                \]  
              },  
              "description": "Is the model black box or interpretable? (Select all that apply)",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "interpretabilityExamples": {  
              "type": "string",  
              "description": "If the model is interpretable, can you give clear examples of this?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "xaiMethods": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "description": "Were specific Explainable AI (XAI) methods used? (e.g. Feature Importance scores, SHAP)",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "output": {  
          "type": "object",  
          "properties": {  
            "outputType": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "enum": \[  
                  "classification",  
                  "regression",  
                  "generative",  
                  "clustering",  
                  "other"  
                \]  
              },  
              "description": "Is the model performing classification, regression, generative tasks, or other outputs? (Select all that apply)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "targetVariable": {  
              "type": "string",  
              "description": "What specifically is being predicted? Identify the target variable and its units.",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "execution": {  
          "type": "object",  
          "properties": {  
            "trainingTime": {  
              "type": "string",  
              "description": "How much time did it take to train the model?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "inferenceTime": {  
              "type": "string",  
              "description": "How much time does a single representative prediction (inference) require?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "hardwareUsed": {  
              "type": "string",  
              "description": "What hardware was used for the execution timings (e.g. specific CPU, GPU, or TPU specifications)?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "energyConsumption": {  
              "type": "string",  
              "description": "What is the estimated energy consumption for training or running a representative prediction?",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "softwareAvailability": {  
          "type": "object",  
          "properties": {  
            "sourceCodeReleased": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is the source code released?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "executableReleased": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is a method to run the algorithm released (executable, web server, virtual machine, container)?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "softwareUrl": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "format": "uri"  
              },  
              "description": "If released, where are the URLs? (Can provide multiple)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "softwareLicence": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "x-options-api": "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json",  
              "description": "If released, what are the licences? (Values fetched from SPDX API)",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        }  
      }  
    },  
    "evaluation": {  
      "type": "object",  
      "properties": {  
        "method": {  
          "type": "object",  
          "properties": {  
            "evaluationMethod": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "enum": \[  
                  "kFoldCrossValidation",  
                  "leaveOneOut",  
                  "holdout",  
                  "independentExternalDataset",  
                  "novelExperiment",  
                  "other"  
                \]  
              },  
              "description": "How were the methods evaluated? (Select all that apply)",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "performanceMeasures": {  
          "type": "object",  
          "properties": {  
            "performanceMetrics": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "enum": \[  
                  "accuracy",  
                  "f1Score",  
                  "aucRoc",  
                  "precision",  
                  "recall",  
                  "rmse",  
                  "mae",  
                  "rSquared",  
                  "matthewsCorrelationCoefficient",  
                  "bleu",  
                  "rouge",  
                  "inceptionScore",  
                  "frechetInceptionDistance",  
                  "other"  
                \]  
              },  
              "description": "Which performance metrics are reported? (Select all that apply)",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "metricsRepresentative": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Is this set representative (for example, compared to the literature)?",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "comparison": {  
          "type": "object",  
          "properties": {  
            "comparisonPublicMethods": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Was a comparison to publicly available methods performed on benchmark datasets?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "comparisonBaselines": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Was a comparison to simpler baselines performed?",  
              "x-complianceLevel": "REQUIREMENT"  
            },  
            "comparedToolsAndBaselines": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "description": "List the specific state-of-the-art tools or simpler baseline models used for comparison.",  
              "x-complianceLevel": "REQUIREMENT"  
            }  
          }  
        },  
        "confidence": {  
          "type": "object",  
          "properties": {  
            "hasConfidenceIntervals": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Do the performance metrics have confidence intervals?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "statisticallySignificant": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the results statistically significant to claim that the method is superior to others and baselines?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "confidenceNumericalValues": {  
              "type": "string",  
              "description": "Provide the actual numerical values for the reported Confidence Intervals or p-values.",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        },  
        "evaluationAvailability": {  
          "type": "object",  
          "properties": {  
            "rawFilesAvailable": {  
              "type": \[  
                "boolean",  
                "string"  
              \],  
              "description": "Are the raw evaluation files available?",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "rawFilesUrl": {  
              "type": "array",  
              "items": {  
                "type": "string",  
                "format": "uri"  
              },  
              "description": "If available, where are the URLs? (Can provide multiple)",  
              "x-complianceLevel": "RECOMMENDATION"  
            },  
            "rawFilesLicence": {  
              "type": "array",  
              "items": {  
                "type": "string"  
              },  
              "x-options-api": "https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json",  
              "description": "If available, what are the licences? (Values fetched from SPDX API)",  
              "x-complianceLevel": "RECOMMENDATION"  
            }  
          }  
        }  
      }  
    }  
  }  
}