class QueryBuilder {
    constructor(model, query, options = {}) {
        this.model = model;
        this.query = query; // e.g., req.query
        this.options = options; // e.g., { defaultLimit: 20, maxLimit: 100 }
        
        this.mongoQuery = {};
        this.page = 1;
        this.limit = options.defaultLimit || 10;
        this.skip = 0;
        this.sort = { createdAt: -1 };
    }

    // Explicitly scope the query to a tenant (organizationId)
    tenant(orgId) {
        if (!orgId) throw new Error('Tenant ID is required for QueryBuilder');
        this.mongoQuery.organizationId = orgId;
        return this;
    }

    // Process generic text search
    search(fields) {
        if (this.query.search) {
            this.mongoQuery.$text = { $search: this.query.search };
        }
        return this;
    }

    // Process exact filters and 'IN' array filters
    filter(allowedFields) {
        allowedFields.forEach(field => {
            if (this.query[field]) {
                const value = this.query[field];
                // Support comma-separated values for $in queries
                if (typeof value === 'string' && value.includes(',')) {
                    this.mongoQuery[field] = { $in: value.split(',').map(v => v.trim()) };
                } else {
                    this.mongoQuery[field] = value;
                }
            }
        });
        return this;
    }

    // Process date ranges
    dateRange(field = 'createdAt') {
        if (this.query.startDate || this.query.endDate) {
            this.mongoQuery[field] = {};
            if (this.query.startDate) this.mongoQuery[field].$gte = new Date(this.query.startDate);
            if (this.query.endDate) this.mongoQuery[field].$lte = new Date(this.query.endDate);
        }
        return this;
    }

    // Process pagination
    paginate() {
        const queryPage = parseInt(this.query.page, 10);
        const queryLimit = parseInt(this.query.limit, 10);
        const maxLimit = this.options.maxLimit || 100;

        this.page = queryPage > 0 ? queryPage : 1;
        this.limit = queryLimit > 0 ? Math.min(queryLimit, maxLimit) : (this.options.defaultLimit || 10);
        this.skip = (this.page - 1) * this.limit;

        return this;
    }

    // Process sorting
    sortBy(allowedSortFields = ['createdAt', 'updatedAt']) {
        if (this.query.sortBy && allowedSortFields.includes(this.query.sortBy)) {
            const order = this.query.sortOrder === 'asc' ? 1 : -1;
            this.sort = { [this.query.sortBy]: order };
        }
        return this;
    }

    // Return the executable Mongoose query and pagination metadata
    async execute() {
        // Run count and query in parallel
        const [data, total] = await Promise.all([
            this.model.find(this.mongoQuery)
                .sort(this.sort)
                .skip(this.skip)
                .limit(this.limit),
            this.model.countDocuments(this.mongoQuery)
        ]);

        return {
            data,
            pagination: {
                total,
                page: this.page,
                limit: this.limit,
                totalPages: Math.ceil(total / this.limit),
            }
        };
    }
}

module.exports = QueryBuilder;
