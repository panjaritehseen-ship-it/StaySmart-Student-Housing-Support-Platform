pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Output "Checking Node.js installation..."

                    node --version
                    npm --version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Node.js and npm are required for the StaySmart CI pipeline."
                    }

                    Write-Output "Node.js and npm are available."
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        'index.html',
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'tests/staysmart.test.js'
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path $file)) {
                            throw "Required project file is missing: $file"
                        }

                        Write-Output "Found: $file"
                    }

                    Write-Output "All required project files are present."
                '''
            }
        }

        stage('JavaScript Syntax Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $jsFiles = @(
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'tests/staysmart.test.js'
                    )

                    foreach ($file in $jsFiles) {

                        Write-Output "Testing JavaScript syntax: $file"

                        node --check $file

                        if ($LASTEXITCODE -ne 0) {
                            throw "JavaScript syntax test failed: $file"
                        }
                    }

                    Write-Output "All JavaScript syntax tests passed."
                '''
            }
        }

        stage('Application Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Output ""
                    Write-Output "========================================"
                    Write-Output " Running StaySmart Test Suite"
                    Write-Output "========================================"
                    Write-Output ""

                    node tests/staysmart.test.js

                    if ($LASTEXITCODE -ne 0) {
                        throw "StaySmart automated tests failed."
                    }

                    Write-Output ""
                    Write-Output "StaySmart automated tests passed."
                '''
            }
        }
    }

    post {
        success {
            echo 'StaySmart CI: ALL TESTS PASSED'
        }

        failure {
            echo 'StaySmart CI: TESTS FAILED'
        }

        always {
            echo 'StaySmart CI: Pipeline execution completed.'
        }
    }
}