
module.exports = {

    parseCommitList: function(out) {
        let arrayOfCommits = [];
        out.split('\n').forEach(item => {
            if (item.trim() !== '') {
                let hash = item.split('<><><>')[0].trim();
                let date = item.split('<><><>')[1].split('|||')[0].trim();
                let commit = item.split('|||')[1].trim();
                arrayOfCommits.push({ hash: hash, commit: commit, date: date });
            }
        });
        return arrayOfCommits;
    },

    parseRepositoryContent: function(out) {
        let arrayOfFiles = [];
        out.split('\n').forEach(item => {
            if (item.trim() !== '') arrayOfFiles.push(item.trim());
        })
        return arrayOfFiles;
    },

    getPathFromUrl: function(req, repositoryId, commitHash, variant) {
        const urlpath = req.originalUrl.replace(req.baseUrl, "");
        const startLine = (commitHash) ? `/api/repos/${repositoryId}/${variant}/${commitHash}/` : `/api/repos/${repositoryId}/${variant}/`;
        const filepath = urlpath.replace(startLine, '');

        // if (urlpath.slice(-1) === '/') return filepath;
        return filepath;
    },

    getPathDeleteMethod: function(req) {
        const urlpath = req.originalUrl.replace(req.baseUrl, "");
        const startLine = '/api/repos/';
        return urlpath.replace(startLine, '');
    }

}
