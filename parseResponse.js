
module.exports = {

    parseCommitList: function(out) {
        arrayOfCommits = [];
        out.split('\n').forEach(item => {
            let hash = item.split('<><><>')[0].trim();
            let date = item.split('<><><>')[1].split('|||')[0].trim();
            let commit = item.split('|||')[1].trim();
            arrayOfCommits.push({ hash: hash, commit: commit, date: date });
        });
        return arrayOfCommits;
    },

    getPathFromUrl: function(req, repositoryId, commitHash, path) {
        const urlpath = req.originalUrl.replace(req.baseUrl, "");
        const startLine = (commitHash) ? `/api/repos/${repositoryId}/tree/${commitHash}/` : `/api/repos/${repositoryId}/tree/`;
        const filepath = urlpath.replace(startLine, '');

        // if (urlpath.slice(-1) === '/') return filepath;
        return filepath;
    }

}
